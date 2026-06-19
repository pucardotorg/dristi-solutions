@echo off
REM Start the PUCAR bulk-sign agent (Windows -- judges' machines).
REM
REM   run.bat            -> pkcs11 (real DSC token); prompts for the token PIN
REM   run.bat software   -> software mode (test cert); no token, no PIN
REM
REM Config (module path, labels, host/port) comes from .env -- copy .env.example first.
setlocal
cd /d "%~dp0"

set "MODE=%~1"
if "%MODE%"=="" set "MODE=pkcs11"

if not exist .venv (
  echo [setup] creating venv + installing deps...
  python -m venv .venv
  call .venv\Scripts\python -m pip install -q --upgrade pip
  call .venv\Scripts\pip install -q -r requirements.txt
)

if "%HOST%"=="" set "HOST=127.0.0.1"
if "%PORT%"=="" set "PORT=1620"

if /I "%MODE%"=="software" (
  set "SIGNER_MODE=software"
  if not exist test-cert.p12 call .venv\Scripts\python gen_test_cert.py
  echo [run] software mode on http://%HOST%:%PORT%
) else (
  set "SIGNER_MODE=pkcs11"
  if "%PKCS11_USER_PIN%"=="" set /p PKCS11_USER_PIN=Enter DSC token PIN:
  echo [run] pkcs11 ^(DSC token^) mode on http://%HOST%:%PORT%
)

call .venv\Scripts\uvicorn app:app --host %HOST% --port %PORT%
endlocal
