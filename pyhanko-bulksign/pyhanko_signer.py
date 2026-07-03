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

# Folder that holds .env / the seal: the executable's dir when frozen, else this
# module's dir (both are where the app is deployed and .env lives).
if getattr(sys, "frozen", False):
    _BASE_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    _BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def resolve_app_path(path):
    """Resolve a bare filename / relative path against the app folder (where .env
    and the exe live). Absolute paths and empty values pass through unchanged.
    Lets .env reference the seal image AND the PKCS#11 module by bare filename, so
    everything can live self-contained in one folder."""
    if path and not os.path.isabs(path):
        return os.path.join(_BASE_DIR, path)
    return path


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
    mode = os.environ.get("SIGNER_MODE", "software").lower()

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

        # Bare filename -> resolved next to .env/exe, so the vendor .so/.dll can
        # live in the same self-contained folder.
        module_path = resolve_app_path(os.environ["PKCS11_MODULE_PATH"])
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
