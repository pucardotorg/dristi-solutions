#!/usr/bin/env bash
# Build a STANDALONE executable (no Python needed on the staff machine).
# Run this once on a LINUX machine -> produces dist/PucarBulkSign
#
# Note: PyInstaller is not a cross-compiler. Build the Linux binary on Linux and
# the Windows .exe on Windows (build_app.bat).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

[ -d .venv ] || python3 -m venv .venv
./.venv/bin/pip install -q --upgrade pip
./.venv/bin/pip install -q -r requirements.txt pyinstaller

./.venv/bin/pyinstaller --noconfirm --clean --onefile --windowed \
  --name PucarBulkSign \
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

# Seal lives next to the exe so a bare SIGN_STAMP_IMAGE=court-seal.png resolves.
[ -f court-seal.png ] && cp court-seal.png dist/ || true

echo
echo "Built: dist/PucarBulkSign"
echo "Distribute dist/PucarBulkSign together with a .env (see .env.example) and"
echo "court-seal.png, all placed NEXT TO each other."
