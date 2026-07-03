#!/usr/bin/env bash
# Build a SELF-CONTAINED Linux package -> dist/linux/
#   dist/linux/{ PucarBulkSign, .env, court-seal.png, <vendor pkcs11 .so> }
# Everything the app needs sits in that one folder (paths in .env are bare
# filenames resolved next to the exe).
#
# To include the token's PKCS#11 module in the folder, point PKCS11_MODULE_SRC at it:
#   PKCS11_MODULE_SRC=/path/to/libcastle_v2.so.1.0.0 ./build_app.sh
#
# Note: PyInstaller is not a cross-compiler -- build the Windows package on Windows
# (build_app.bat -> dist\windows\).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

DIST="dist/linux"

[ -d .venv ] || python3 -m venv .venv
./.venv/bin/pip install -q --upgrade pip
./.venv/bin/pip install -q -r requirements.txt pyinstaller

rm -rf "$DIST"
./.venv/bin/pyinstaller --noconfirm --clean --onefile --windowed \
  --name PucarBulkSign \
  --distpath "$DIST" \
  --collect-submodules uvicorn \
  --collect-all pyhanko \
  --collect-all pyhanko_certvalidator \
  --collect-all asn1crypto \
  --collect-submodules pkcs11 \
  --collect-submodules multipart \
  --hidden-import app \
  --hidden-import pyhanko_signer \
  --hidden-import gen_test_cert \
  --hidden-import token_utils \
  bulk_sign_app.py

# --- assemble the self-contained folder -------------------------------------
[ -f .env ] && cp .env "$DIST/.env"
[ -f court-seal.png ] && cp court-seal.png "$DIST/"
if [ -n "${PKCS11_MODULE_SRC:-}" ] && [ -f "${PKCS11_MODULE_SRC}" ]; then
  cp "${PKCS11_MODULE_SRC}" "$DIST/"
  echo "Included PKCS#11 module: $(basename "$PKCS11_MODULE_SRC")"
else
  echo "NOTE: set PKCS11_MODULE_SRC=/path/to/vendor.so to bundle the token module,"
  echo "      then set PKCS11_MODULE_PATH=<that filename> in $DIST/.env."
fi

echo
echo "Built self-contained package: $DIST/"
ls -1 "$DIST"
