@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title MY LITTLE PONY - THE LAST SAVE
chcp 65001 >nul 2>&1
color 0A

set "LOG=%~dp0START_GAME.log"
set "NODE_VERSION="
set "NPM_VERSION="

>"%LOG%" echo ========================================================
>>"%LOG%" echo THE LAST SAVE launcher started: %date% %time%

cls
echo.
echo ========================================================
echo        MY LITTLE PONY: THE LAST SAVE
echo          Friendship was never deleted.
echo ========================================================
echo.

echo [1/5] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 goto NODE_FAIL
for /f "delims=" %%V in ('node --version 2^>nul') do set "NODE_VERSION=%%V"
echo Node.js: !NODE_VERSION!
>>"%LOG%" echo Node.js: !NODE_VERSION!

where npm >nul 2>&1
if errorlevel 1 goto NPM_FAIL
for /f "delims=" %%V in ('npm --version 2^>nul') do set "NPM_VERSION=%%V"
echo npm: !NPM_VERSION!
>>"%LOG%" echo npm: !NPM_VERSION!


echo.
echo [2/5] Checking project files...
if not exist "package.json" goto PROJECT_FAIL
if not exist "main.js" goto PROJECT_FAIL
if not exist "game.js" goto PROJECT_FAIL
if not exist "index.html" goto PROJECT_FAIL
if not exist "styles.css" goto PROJECT_FAIL
echo Project files: OK


rem ------------------------------------------------------------
rem Dependencies: do NOT run npm install on every launch.
rem Only repair/install when Electron is actually missing.
rem ------------------------------------------------------------
echo.
echo [3/5] Checking dependencies...
if exist "node_modules\electron\cli.js" (
    echo Electron dependency already installed. Skipping npm install.
    >>"%LOG%" echo Existing Electron dependency detected; skipped npm install.
    goto DEPS_OK
)

echo Electron is missing. Installing dependencies...
echo First launch may take a few minutes while Electron is downloaded.
echo.
>>"%LOG%" echo Running npm install.

call npm install --no-audit --no-fund --progress=false --loglevel=warn --fetch-retries=2 --fetch-retry-mintimeout=2000 --fetch-retry-maxtimeout=10000 --fetch-timeout=120000 >>"%LOG%" 2>&1
set "NPM_INSTALL_EXIT=!ERRORLEVEL!"
if not "!NPM_INSTALL_EXIT!"=="0" goto NPM_INSTALL_FAIL

if not exist "node_modules\electron\cli.js" goto NPM_INSTALL_FAIL

echo Dependencies installed successfully.
>>"%LOG%" echo npm install completed successfully.

:DEPS_OK

echo.
echo [4/5] Checking JavaScript...
node --check main.js >nul 2>&1
if errorlevel 1 (
    echo ERROR: main.js contains a syntax error.
    >>"%LOG%" echo ERROR: main.js syntax check failed.
    node --check main.js >>"%LOG%" 2>&1
    goto FAIL
)
node --check game.js >nul 2>&1
if errorlevel 1 (
    echo ERROR: game.js contains a syntax error.
    >>"%LOG%" echo ERROR: game.js syntax check failed.
    node --check game.js >>"%LOG%" 2>&1
    goto FAIL
)
echo JavaScript checks: OK


echo.
echo [5/5] Starting the game...
echo.
>>"%LOG%" echo Starting: npm start
call npm start >>"%LOG%" 2>&1
set "EXITCODE=!ERRORLEVEL!"
>>"%LOG%" echo Game exit code: !EXITCODE!

if not "!EXITCODE!"=="0" (
    echo.
    echo ========================================================
    echo GAME FAILED TO START OR CLOSED WITH ERROR !EXITCODE!
    echo See START_GAME.log for the full Electron error.
    echo ========================================================
    goto FAIL
)

echo.
echo Game closed normally.
echo.
pause
exit /b 0

:NODE_FAIL
echo.
echo ERROR: Node.js is not installed or not available in PATH.
echo Install Node.js LTS from https://nodejs.org/ then restart this file.
>>"%LOG%" echo ERROR: node command not found.
goto FAIL

:NPM_FAIL
echo.
echo ERROR: npm is not available in PATH.
echo Reinstall Node.js LTS and make sure npm is enabled.
>>"%LOG%" echo ERROR: npm command not found.
goto FAIL

:PROJECT_FAIL
echo.
echo ERROR: One or more game files are missing.
echo Make sure START_GAME.bat is in the project root.
>>"%LOG%" echo ERROR: required project file missing.
goto FAIL

:NPM_INSTALL_FAIL
echo.
echo ERROR: Dependency installation failed.
echo The installer no longer retries forever.
echo Check START_GAME.log for the exact npm/Electron error.
>>"%LOG%" echo ERROR: npm install failed with code !NPM_INSTALL_EXIT!.
goto FAIL

:FAIL
echo.
echo Launcher stopped.
echo Log file: %LOG%
echo.
pause
exit /b 1
