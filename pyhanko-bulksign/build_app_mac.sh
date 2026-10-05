#!/usr/bin/env bash
# Build the macOS package -> dist/macos/{ OncourtsBulkSign.app, READ-ME-FIRST.txt }
#
# Unlike Windows/Linux, .env, court-seal.png and the token library are bundled
# INSIDE the .app: macOS may run a downloaded app from a hidden read-only copy
# (App Translocation) that cannot see files placed next to it. Files put next to
# the .app still take precedence when visible. Writable files (test certificate,
# self-test report) go to ~/Library/Application Support/OnCourts Bulk Sign.
#
# To bundle the token's PKCS#11 library, point PKCS11_MODULE_SRC at it:
#   PKCS11_MODULE_SRC=/usr/local/lib/libcastle_v2.1.0.0.dylib ./build_app_mac.sh
#
# Builds for the CPU of the machine it runs on (Apple Silicon or Intel); the
# HYP2003 dylib itself is universal.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

DIST="dist/macos"
WORK="dist/macos-build"

[ -d .venv ] || python3 -m venv .venv
./.venv/bin/pip install -q --upgrade pip
# Prebuilt cryptography only: a source build links Homebrew OpenSSL, which clashes
# with Python's own libssl inside the .app (see requirements.txt).
./.venv/bin/pip install -q --only-binary=cryptography -r requirements.txt pyinstaller

EXTRA=()
if [ -n "${PKCS11_MODULE_SRC:-}" ] && [ -f "${PKCS11_MODULE_SRC}" ]; then
  EXTRA+=(--add-binary "${PKCS11_MODULE_SRC}:.")
  echo "Bundling PKCS#11 module: $(basename "$PKCS11_MODULE_SRC")"
else
  echo "NOTE: no token library bundled (set PKCS11_MODULE_SRC=/path/to/vendor.dylib)."
fi

rm -rf "$DIST" "$WORK"
./.venv/bin/pyinstaller --noconfirm --clean --windowed \
  --name OncourtsBulkSign \
  --osx-bundle-identifier org.pucar.oncourts.bulksign \
  --distpath "$WORK" \
  --collect-submodules uvicorn \
  --collect-all pyhanko \
  --collect-all pyhanko_certvalidator \
  --collect-all asn1crypto \
  --collect-submodules pkcs11 \
  --collect-submodules multipart \
  --hidden-import app \
  --hidden-import app_paths \
  --hidden-import pyhanko_signer \
  --hidden-import gen_test_cert \
  --hidden-import token_utils \
  --hidden-import selftest \
  --hidden-import diagnostics \
  --hidden-import linux_setup \
  --hidden-import test_client \
  --add-data ".env:." \
  --add-data "court-seal.png:." \
  ${EXTRA[@]+"${EXTRA[@]}"} \
  bulk_sign_app.py

mkdir -p "$DIST"
mv "$WORK/OncourtsBulkSign.app" "$DIST/"
cp READ-ME-FIRST.txt "$DIST/"
rm -rf "$WORK"

echo
echo "Built: $DIST/ ($(uname -m))"
ls -1 "$DIST"
