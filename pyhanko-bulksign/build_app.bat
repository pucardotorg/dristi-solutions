@echo off
REM Build a STANDALONE executable (no Python needed on the staff machine).
REM Run this once on a WINDOWS machine -> produces dist\PucarBulkSign.exe
REM
REM Note: PyInstaller is not a cross-compiler. Build the .exe on Windows.
setlocal
cd /d "%~dp0"

if not exist .venv python -m venv .venv
call .venv\Scripts\python -m pip install -q --upgrade pip
call .venv\Scripts\pip install -q -r requirements.txt pyinstaller

call .venv\Scripts\pyinstaller --noconfirm --clean --onefile --windowed ^
  --name PucarBulkSign ^
  --collect-submodules uvicorn ^
  --collect-all pyhanko ^
  --collect-all pyhanko_certvalidator ^
  --collect-all asn1crypto ^
  --collect-submodules pkcs11 ^
  --collect-submodules multipart ^
  --hidden-import app ^
  --hidden-import pyhanko_signer ^
  --hidden-import gen_test_cert ^
  bulk_sign_app.py

echo.
echo Built: dist\PucarBulkSign.exe
echo Distribute that file together with a .env (see .env.example) placed NEXT TO it.
endlocal
