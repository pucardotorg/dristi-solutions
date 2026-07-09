@echo off
REM Build a SELF-CONTAINED Windows package -> dist\windows\
REM   dist\windows\{ OncourtsBulkSign.exe, .env, court-seal.png, <vendor pkcs11 .dll> }
REM Everything the app needs sits in that one folder (paths in .env are bare
REM filenames resolved next to the exe).
REM
REM To include the token's PKCS#11 module in the folder, set PKCS11_MODULE_SRC:
REM   set PKCS11_MODULE_SRC=C:\Windows\System32\vendor.dll
REM   build_app.bat
REM
REM Note: PyInstaller is not a cross-compiler -- run this ON Windows.
setlocal
cd /d "%~dp0"

set "DIST=dist\windows"

if not exist .venv python -m venv .venv
call .venv\Scripts\python -m pip install -q --upgrade pip
call .venv\Scripts\pip install -q -r requirements.txt pyinstaller

if exist "%DIST%" rmdir /s /q "%DIST%"
call .venv\Scripts\pyinstaller --noconfirm --clean --onefile --windowed ^
  --name OncourtsBulkSign ^
  --distpath "%DIST%" ^
  --collect-submodules uvicorn ^
  --collect-all pyhanko ^
  --collect-all pyhanko_certvalidator ^
  --collect-all asn1crypto ^
  --collect-submodules pkcs11 ^
  --collect-submodules multipart ^
  --hidden-import app ^
  --hidden-import pyhanko_signer ^
  --hidden-import gen_test_cert ^
  --hidden-import token_utils ^
  bulk_sign_app.py

REM --- assemble the self-contained folder ------------------------------------
if exist .env copy /y .env "%DIST%\.env" >nul
if exist court-seal.png copy /y court-seal.png "%DIST%\" >nul
if not "%PKCS11_MODULE_SRC%"=="" if exist "%PKCS11_MODULE_SRC%" copy /y "%PKCS11_MODULE_SRC%" "%DIST%\" >nul

echo.
echo Built self-contained package: %DIST%\
dir /b "%DIST%"
endlocal
