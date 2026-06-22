#!/usr/bin/env bash
# Launch the PUCAR Bulk Sign desktop app (Linux/macOS) from source.
# First run sets up the environment automatically; later runs just open the window.
# Requires: python3 with Tk (Debian/Ubuntu: sudo apt install python3-tk).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d .venv ]; then
  echo "First-time setup (one minute)…"
  python3 -m venv .venv
  ./.venv/bin/pip install -q --upgrade pip
  ./.venv/bin/pip install -q -r requirements.txt
fi

exec ./.venv/bin/python bulk_sign_app.py
