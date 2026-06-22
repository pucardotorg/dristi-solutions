@echo off
REM Launch the PUCAR Bulk Sign desktop app (Windows) from source.
REM First run sets up the environment automatically; later runs just open the window.
REM Requires: Python 3.10+ from python.org (Tkinter is included).
setlocal
cd /d "%~dp0"

if not exist .venv (
  echo First-time setup ^(one minute^)...
  python -m venv .venv
  call .venv\Scripts\python -m pip install -q --upgrade pip
  call .venv\Scripts\pip install -q -r requirements.txt
)

REM pythonw + start => no console window; the GUI runs on its own.
start "" .venv\Scripts\pythonw bulk_sign_app.py
endlocal
