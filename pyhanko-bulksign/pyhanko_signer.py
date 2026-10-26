"""
pyHanko-based PDF signer for PUCAR bulk signing.

Replaces the proprietary Capricorn `pkiNetworkSign` agent. Given an UNSIGNED pdf
(bytes) + a signature placement (page, x, y, w, h), it applies a digitally-signed,
*visible* signature (PAdES / PKCS#7) and returns the fully signed pdf bytes.

Two signer backends (selected by SIGNER_MODE):

  * SIGNER_MODE=software  -> sign with a PKCS#12 (.p12/.pfx) key file.
                             For testing / CI WITHOUT a physical DSC token.
  * SIGNER_MODE=pkcs11    -> sign with a hardware DSC token via its PKCS#11 module.
                             This is the production path: the SAME USB DSC tokens
                             (ePass2003 / Hypersecu / WatchData / SafeNet ...) used
                             through the vendor's PKCS#11 .so/.dll.

The signing core is identical for both modes -- only the Signer object differs.
This module is intentionally court-agnostic: a thin, swappable signing core.
"""

import io
import os
import sys

from pyhanko.pdf_utils.images import PdfImage
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.sign import signers
from pyhanko.sign.fields import SigFieldSpec
from pyhanko.sign.signers import PdfSignatureMetadata
from pyhanko.stamp import TextStampStyle

# --- Visible-signature appearance -------------------------------------------
# Text lines, drawn over an optional background seal/logo image.
#
# Configurable via env:
#   SIGN_STAMP_TEXT    text template; %(signer)s = certificate CN, %(ts)s = time
#   SIGN_STAMP_IMAGE   seal/logo image (PNG/JPG). A relative name or bare filename
#                      is resolved NEXT TO the .env / executable, so the seal can
#                      simply live in the same folder. Default: "court-seal.png"
#                      (used only if that file is actually present). Absolute paths
#                      are used as-is.
#   SIGN_STAMP_OPACITY 0..1 opacity of that image (default 1.0)
#
# border_width=0 removes pyHanko's default heavy black box (which basic viewers
# render as a solid black rectangle). Note: the "?" / "Signature Not Verified"
# in Adobe is the VIEWER's validity icon for an untrusted cert (turns into a green
# check once CCA trust is configured) -- it is NOT drawn here.

# Folder that holds .env / the seal: next to the exe (inside the .app on macOS
# as a fallback) -- see app_paths.
from app_paths import APP_DIR as _BASE_DIR
from app_paths import SEARCH_DIRS as _SEARCH_DIRS
from app_paths import find_file


def resolve_app_path(path):
    """Resolve a bare filename / relative path against the app folder (where .env
    and the exe live; on macOS also inside the .app). Absolute paths and empty
    values pass through unchanged. Lets .env reference the seal image AND the
    PKCS#11 module by bare filename, so everything can live in one folder."""
    if path and not os.path.isabs(path):
        return find_file(path)
    return path


# --- DSC token library (PKCS#11 module) discovery ---------------------------
# Each token brand ships its own PKCS#11 library (.dll on Windows, .so on Linux,
# .dylib on macOS).
# Candidates, in this order (all of them are collected; token detection tries
# each and uses the first that actually sees a token -- see select_module()):
#   1. PKCS11_MODULE_PATH from .env, if that file exists
#   2. any token library in the app folder (next to the exe) -- the bundled
#      HYP2003 library, or a vendor library an admin dropped there
#   3. the vendors' standard install locations (token driver installed), e.g.
#      WatchData ProxKey, whose library needs its driver installed to work
if os.name == "nt":
    _LIB_EXT = (".dll",)
elif sys.platform == "darwin":
    _LIB_EXT = (".dylib",)
else:
    _LIB_EXT = (".so",)

if os.name == "nt":
    _SYS32 = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32")
    _PROGRAM_DIRS = [os.environ.get("ProgramFiles", r"C:\Program Files"),
                     os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")]
    _KNOWN_MODULES = [
        os.path.join(_SYS32, "eps2003csp11v2.dll"),   # ePass2003 / HYP2003 India (FIPS 140-3) driver
        os.path.join(_SYS32, "HYP2003csp11IND.dll"),  # HYP2003 India driver
        os.path.join(_SYS32, "HyperPKICsp11_2003.dll"),  # HYP2003 global HyperPKI driver
        os.path.join(_SYS32, "eps2003csp11.dll"),     # ePass2003 (older driver)
        os.path.join(_SYS32, "SignatureP11.dll"),     # WatchData ProxKey (needs its driver)
        os.path.join(_SYS32, "eTPKCS11.dll"),         # SafeNet eToken
    ]
    # Vendor install folders, searched for a PKCS#11-looking .dll.
    _VENDOR_GLOBS = [os.path.join(d, v, "**", "*.dll")
                     for d in _PROGRAM_DIRS if d
                     for v in ("HyperPKI*", "Hypersecu*", "ePass2003*", "WatchData*")] + [
        # WatchData's core PKCS#11 library (SignatureP11.dll is only a front end
        # for it); its installer puts it in a vendor subfolder of System32.
        os.path.join(_SYS32, "*", "wdpkcs*.dll"),
        os.path.join(_SYS32, "*", "*", "wdpkcs*.dll"),
    ]
elif sys.platform == "darwin":
    _KNOWN_MODULES = []
    _VENDOR_GLOBS = [
        "/usr/local/lib/libcastle*.dylib",            # HYP2003 / ePass2003 (vendor .pkg)
        "/usr/local/lib/wdProxKeyUsbKeyTool/libwdpkcs*.dylib",  # WatchData ProxKey
        "/usr/local/lib/libeTPkcs11.dylib",           # SafeNet eToken
    ]
else:
    _KNOWN_MODULES = []
    _VENDOR_GLOBS = [
        "/usr/lib/libcastle*.so*",                    # HYP2003 / ePass2003 (castle)
        "/usr/lib/x86_64-linux-gnu/libcastle*.so*",
        "/usr/local/lib/libcastle*.so*",
        "/usr/lib/WatchData/ProxKey/lib/libwdpkcs*.so*",   # WatchData ProxKey
        "/usr/lib/libeTPkcs11.so*",
    ]

# Name hints for files found by a broad search; the app folder accepts any library.
_P11_HINTS = ("pkcs11", "p11", "csp11", "castle", "wdpkcs")


def _is_library(name: str) -> bool:
    lower = name.lower()
    return any(lower.endswith(ext) or (ext + ".") in lower for ext in _LIB_EXT)


def find_pkcs11_modules():
    """
    All candidate PKCS#11 libraries, in preference order (no duplicates).
    Returns (paths, searched); `searched` lists every place looked, so a "not
    found" error can tell the user exactly where we looked.
    """
    import glob

    found, searched = [], []

    def add(p):
        if p and os.path.isfile(p) and os.path.normcase(os.path.abspath(p)) not in {
                os.path.normcase(os.path.abspath(f)) for f in found}:
            found.append(p)

    configured = (os.environ.get("PKCS11_MODULE_PATH") or "").strip()
    if configured:
        p = resolve_app_path(configured)
        searched.append(p)
        add(p)

    for i, d in enumerate(_SEARCH_DIRS):
        searched.append(os.path.join(d, "<any token library>"))
        try:
            names = os.listdir(d)
        except OSError:
            continue
        # The app folder accepts any library; the macOS .app's own bundle also
        # holds Python's libraries, so there only PKCS#11-looking names count.
        for f in sorted(names):
            if _is_library(f) and (i == 0 or any(h in f.lower() for h in _P11_HINTS)):
                add(os.path.join(d, f))

    for p in _KNOWN_MODULES:
        searched.append(p)
        add(p)

    for pattern in _VENDOR_GLOBS:
        searched.append(pattern)
        for p in sorted(glob.glob(pattern, recursive=True)):
            if any(h in os.path.basename(p).lower() for h in _P11_HINTS):
                add(p)

    return found, searched


# The library that last found a token (set by token detection / START), used for
# signing so that every request talks to the same, working library.
_selected_module = None


def select_module(path):
    global _selected_module
    _selected_module = path


def find_pkcs11_module():
    """The library to use: the one that found the token, else the first
    candidate. Returns (path or None, searched)."""
    paths, searched = find_pkcs11_modules()
    if _selected_module and _selected_module in paths:
        return _selected_module, searched
    return (paths[0] if paths else None), searched


def require_pkcs11_module() -> str:
    """find_pkcs11_module(), raising an actionable error if nothing is found."""
    path, searched = find_pkcs11_module()
    if path:
        return path
    raise RuntimeError(
        "DSC token library not found. Install the token's driver, or copy the "
        f"vendor PKCS#11 library ({'/'.join(_LIB_EXT)}) into {_BASE_DIR}.\n"
        "Looked in:\n  " + "\n  ".join(searched)
    )


def prepare_module_dir(module_path: str):
    """
    Let a vendor .dll that depends on sibling DLLs load on Windows: Python 3.8+
    no longer searches PATH for dependencies, so register the module's folder
    (and the app folder) explicitly. No-op elsewhere.
    """
    if os.name != "nt":
        return
    for d in {os.path.dirname(module_path), _BASE_DIR}:
        try:
            os.add_dll_directory(d)
        except (OSError, AttributeError):
            pass
        if d not in os.environ.get("PATH", ""):
            os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", "")


_STAMP_TEXT = os.environ.get(
    "SIGN_STAMP_TEXT", "Digitally signed by %(signer)s\nDate: %(ts)s"
)
_STAMP_IMAGE = resolve_app_path(os.environ.get("SIGN_STAMP_IMAGE", "court-seal.png"))
_STAMP_OPACITY = float(os.environ.get("SIGN_STAMP_OPACITY", "1.0"))

_BACKGROUND = None
if _STAMP_IMAGE and os.path.exists(_STAMP_IMAGE):
    _BACKGROUND = PdfImage(_STAMP_IMAGE)

_STAMP_STYLE = TextStampStyle(
    stamp_text=_STAMP_TEXT,
    background=_BACKGROUND,
    background_opacity=_STAMP_OPACITY,
    border_width=0,
)


def _build_signer():
    """Construct a pyHanko Signer based on environment configuration."""
    # DSC token unless explicitly asked for test signing (only the self-test does).
    mode = os.environ.get("SIGNER_MODE", "pkcs11").lower()

    if mode == "software":
        p12_path = os.environ.get("SIGNER_P12_PATH", "test-cert.p12")
        p12_pass = os.environ.get("SIGNER_P12_PASSWORD", "test")
        signer = signers.SimpleSigner.load_pkcs12(
            pfx_file=p12_path,
            passphrase=p12_pass.encode("utf-8") if p12_pass else None,
        )
        if signer is None:
            raise RuntimeError(
                f"Could not load PKCS#12 file '{p12_path}'. "
                "Run gen_test_cert.py first, or fix SIGNER_P12_PATH/SIGNER_P12_PASSWORD."
            )
        return signer

    if mode == "pkcs11":
        # Imported lazily so the software path has no hard pkcs11 dependency.
        from pyhanko.config.pkcs11 import PKCS11SignatureConfig
        from pyhanko.sign.pkcs11 import PKCS11SigningContext

        # .env path, else a library next to the exe, else the vendor install dir.
        module_path = require_pkcs11_module()
        prepare_module_dir(module_path)
        cert_label = os.environ.get("PKCS11_CERT_LABEL") or None
        key_label = os.environ.get("PKCS11_KEY_LABEL") or None

        # Auto-detect: if no cert label is configured, use the token's sole identity
        # (raises a clear error for zero / multiple certs). Lets a new DSC pendrive
        # work with no .env editing.
        if not cert_label:
            from token_utils import detect_single_cert_label

            cert_label = detect_single_cert_label(module_path)

        config = PKCS11SignatureConfig(
            module_path=module_path,
            token_criteria=None,
            cert_label=cert_label,
            key_label=key_label,   # None -> pyHanko defaults key_label to cert_label
            user_pin=os.environ.get("PKCS11_USER_PIN"),
        )
        # Context manager; the caller keeps it open for the duration of the request.
        return PKCS11SigningContext(config)

    raise RuntimeError(f"Unknown SIGNER_MODE '{mode}' (use 'software' or 'pkcs11')")


def validate_signer():
    """
    Build the configured signer and confirm it is usable.

    For pkcs11 mode this opens a token session and logs in, which validates the
    PIN and that the token is reachable -- so the desktop app can give the user
    immediate feedback on Start instead of failing on every order.

    Returns the signer certificate's Common Name if available (else None).
    Raises on failure (wrong PIN, token not present, bad config, ...).
    """
    def _cn(s):
        try:
            return s.subject_name
        except Exception:
            return None

    signer_obj = _build_signer()
    if hasattr(signer_obj, "__enter__"):
        with signer_obj as real_signer:
            return _cn(real_signer)
    return _cn(signer_obj)


def sign_pdf_bytes(pdf_bytes: bytes, page: int, x: float, y: float,
                   width: float, height: float, field_name: str = "Signature") -> bytes:
    """
    Sign `pdf_bytes`, placing a visible signature box of (width x height) with its
    lower-left corner at (x, y) on the given 1-based `page`. Returns signed PDF bytes.
    """
    # pyHanko box is (llx, lly, urx, ury) in PDF user-space (origin bottom-left).
    # Capricorn sends (x, y) as the lower-left and size as (w, h); map directly.
    box = (x, y, x + width, y + height)
    on_page = max(page - 1, 0)  # pyHanko is 0-indexed; Capricorn <page> is 1-based

    field_spec = SigFieldSpec(sig_field_name=field_name, on_page=on_page, box=box)
    meta = PdfSignatureMetadata(field_name=field_name)

    signer_obj = _build_signer()

    in_buf = io.BytesIO(pdf_bytes)
    writer = IncrementalPdfFileWriter(in_buf)
    out_buf = io.BytesIO()

    def _do_sign(real_signer):
        # PdfSigner (not the signers.sign_pdf convenience fn) so we can pass a
        # custom stamp_style -- a text-only appearance with no background graphic.
        pdf_signer = signers.PdfSigner(
            meta,
            signer=real_signer,
            stamp_style=_STAMP_STYLE,
            new_field_spec=field_spec,
        )
        pdf_signer.sign_pdf(writer, output=out_buf)

    # PKCS#11 backend is a context manager that yields the real signer.
    if hasattr(signer_obj, "__enter__"):
        with signer_obj as real_signer:
            _do_sign(real_signer)
    else:
        _do_sign(signer_obj)

    return out_buf.getvalue()
