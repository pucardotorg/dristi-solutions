#!/usr/bin/env bash
# Start the PUCAR bulk-sign agent (Linux/macOS).
#
#   ./run.sh            -> pkcs11 (real DSC token); prompts for the token PIN
#   ./run.sh software   -> software mode (test cert); no token, no PIN
#
# Config (module path, labels, host/port) comes from .env -- copy .env.example first.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

MODE="${1:-pkcs11}"

# venv + deps (idempotent)
if [ ! -d .venv ]; then
  echo "[setup] creating venv + installing deps..."
  python3 -m venv .venv
  ./.venv/bin/pip install -q --upgrade pip
  ./.venv/bin/pip install -q -r requirements.txt
fi

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-1620}"

if [ "$MODE" = "software" ]; then
  export SIGNER_MODE=software
  [ -f test-cert.p12 ] || ./.venv/bin/python gen_test_cert.py
  echo "[run] software mode on http://$HOST:$PORT"
else
  export SIGNER_MODE=pkcs11
  # PIN read interactively so it never lands in shell history / env files.
  if [ -z "${PKCS11_USER_PIN:-}" ]; then
    read -r -s -p "Enter DSC token PIN: " PKCS11_USER_PIN; echo
    export PKCS11_USER_PIN
  fi
  echo "[run] pkcs11 (DSC token) mode on http://$HOST:$PORT"
fi

exec ./.venv/bin/uvicorn app:app --host "$HOST" --port "$PORT"
