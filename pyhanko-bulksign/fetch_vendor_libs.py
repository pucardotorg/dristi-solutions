"""
Fetch the HYP2003 DSC token's PKCS#11 library for one OS, for bundling into the
package (used by the CI build; vendor binaries are not stored in this repo).

The vendor's driver download is unpacked and the library is checked against the
SHA-256 of the exact file that was tested with a real token, so the build fails
loudly if the vendor ever changes it (re-test, then update the hash).

    python fetch_vendor_libs.py windows|linux|macos <out_dir>

Prints the library path; under GitHub Actions also exports PKCS11_MODULE_SRC
(and, for macOS, VENDOR_DRIVER_PKG_SRC: the vendor's signed driver installer,
bundled so the app can install the token's reader driver on first use).
Needs 7-Zip (`7z`/`7zz`) for the Windows installer and `pkgutil` (macOS) or
7-Zip for the macOS .pkg.
"""

import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

_BASE = "https://charteredinfo.com/DSC/TokenDrivers/"

# os -> (driver zip URL, file inside the unpacked driver, name in our package, SHA-256)
LIBS = {
    # HYP2003 India FIPS 140-3 driver; 64-bit PKCS#11 DLL (installs as
    # System32\eps2003csp11v2.dll). Tested on Windows 11 with a HYP2003 token.
    "windows": (_BASE + "HYP2003-Setup-FIPS140-3.zip", "HYP2003csp11IND64.dll",
                "eps2003csp11v2.dll",
                "2b31d7a68a20d4ea2ef44d10052aaa5e672d4c72a0bd9869c81adfa1c91ae7c8"),
    "linux": (_BASE + "HYP2003-Linux-x86_64-FIPS140-3.zip", "libcastle_v2.so.1.0.0",
              "libcastle_v2.so.1.0.0",
              "75df0f4a474f88996b0218e6c0b41f99a0d5825b03900a3d48b6d38384f8e9e0"),
    # Universal (x86_64 + arm64) dylib from the HYP2003 India macOS .pkg.
    "macos": (_BASE + "HYP2003-MAC-iOS-FIPS140-3.zip", "libcastle_v2.1.0.0.dylib",
              "libcastle_v2.1.0.0.dylib",
              "8eac3882ba00449748d0b5e656c8c4939a820c9a402834b4e0da199fd34c9653"),
}


# Extra files bundled per OS: (file inside the driver download, name in our
# package, SHA-256, env var exported for the build).
EXTRAS = {
    # macOS needs the vendor's smart-card reader driver (ifd-FeiTccid.bundle);
    # verified: the token is detected only after installing this package.
    "macos": [("HYP2003-India-20260703.pkg", "HYP2003-India-driver.pkg",
               "354ad59c50407325af34375a9c63b89957e34fb2f360194c1f80f7a5c214ed74",
               "VENDOR_DRIVER_PKG_SRC")],
}


def _sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _seven_zip() -> str:
    for exe in ("7z", "7zz", "7za"):
        if shutil.which(exe):
            return exe
    raise SystemExit("7-Zip (7z/7zz) is required to unpack the vendor installer")


def _unpack(path: str, dest: str):
    """Unpack the driver zip, then the installer inside it (NSIS .exe or .pkg)."""
    with zipfile.ZipFile(path) as zf:
        zf.extractall(dest)
    for root, _, files in os.walk(dest):
        for f in files:
            if f.lower().endswith((".exe", ".pkg")):
                _unpack_installer(os.path.join(root, f), os.path.join(root, f + ".d"))


def _unpack_installer(path: str, dest: str):
    if path.lower().endswith(".exe"):
        subprocess.run([_seven_zip(), "x", "-y", f"-o{dest}", path],
                       check=True, stdout=subprocess.DEVNULL)
    elif shutil.which("pkgutil"):
        subprocess.run(["pkgutil", "--expand-full", path, dest], check=True)
    else:  # 7-Zip: xar -> */Payload (gzip+cpio) -> files
        sz = _seven_zip()
        subprocess.run([sz, "x", "-y", f"-o{dest}", path], check=True, stdout=subprocess.DEVNULL)
        for root, _, files in os.walk(dest):
            if "Payload" in files:
                out = os.path.join(root, "Payload.d")
                subprocess.run([sz, "x", "-y", f"-o{out}", os.path.join(root, "Payload")],
                               check=True, stdout=subprocess.DEVNULL)
                for g in os.listdir(out):
                    subprocess.run([sz, "x", "-y", f"-o{out}", os.path.join(out, g)],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def _pick(work: str, inner_name: str, sha: str, url: str) -> str:
    found = []
    for root, _, files in os.walk(work):
        for f in files:
            if f == inner_name:
                p = os.path.join(root, f)
                found.append((p, _sha256(p)))
    match = next((p for p, h in found if h == sha), None)
    if not match:
        raise SystemExit(
            f"{inner_name}: no copy with the tested SHA-256 {sha} in {url}.\n"
            f"Found: {[h for _, h in found] or 'none'}. The vendor changed the driver: "
            "re-test the new file with a real token, then update LIBS/EXTRAS.")
    return match


def fetch(target: str, out_dir: str):
    """Returns [(path, env_var)]: the library first, then any EXTRAS."""
    url, inner_name, out_name, sha = LIBS[target]
    work = tempfile.mkdtemp(prefix="vendor-")
    archive = os.path.join(work, os.path.basename(url))
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=300) as resp, open(archive, "wb") as fh:
        shutil.copyfileobj(resp, fh)
    _unpack(archive, os.path.join(work, "x"))

    os.makedirs(out_dir, exist_ok=True)
    wanted = [(inner_name, out_name, sha, "PKCS11_MODULE_SRC")] + EXTRAS.get(target, [])
    results = []
    for inner, out, digest, env_var in wanted:
        dest = os.path.join(out_dir, out)
        shutil.copyfile(_pick(work, inner, digest, url), dest)
        results.append((os.path.abspath(dest), env_var))
    shutil.rmtree(work, ignore_errors=True)
    return results


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in LIBS:
        raise SystemExit(f"usage: {sys.argv[0]} {'|'.join(LIBS)} <out_dir>")
    results = fetch(sys.argv[1], sys.argv[2])
    gh_env = os.environ.get("GITHUB_ENV")
    for dest, env_var in results:
        print(f"{env_var}={dest}")
        if gh_env:
            with open(gh_env, "a", encoding="utf-8") as fh:
                fh.write(f"{env_var}={dest}\n")


if __name__ == "__main__":
    main()
