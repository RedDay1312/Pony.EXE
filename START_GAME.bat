@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title MY LITTLE PONY - THE LAST SAVE
chcp 65001 >nul 2>&1
color 0A

set "LOG=%~dp0START_GAME.log"
set "NODE_EXE="
set "NPM_CMD="

>"%LOG%" echo ========================================================
>>"%LOG%" echo THE LAST SAVE launcher started: %date% %time%

echo.
echo ========================================================
echo        MY LITTLE PONY: THE LAST SAVE
echo          Friendship was never deleted.
echo ========================================================
echo.

echo [1/5] Checking Node.js...
where node >nul 2>&1
if not errorlevel 1 goto NODE_OK

echo Node.js was not found. Trying automatic installation...
>>"%LOG%" echo Node.js not found. Trying winget installation.
where winget >nul 2>&1
if errorlevel 1 goto NODE_FAIL

winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
if errorlevel 1 goto NODE_FAIL

rem Refresh PATH for this process after winget installation.
set "PATH=%ProgramFiles%\nodejs;%AppData%\npm;%PATH%"
where node >nul 2>&1
if errorlevel 1 goto NODE_FAIL

:NODE_OK
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
if not exist "package.json" (
  echo ERROR: package.json was not found.
  >>"%LOG%" echo ERROR: package.json was not found.
  goto FAIL
)
if not exist "main.js" (
  echo ERROR: main.js was not found.
  >>"%LOG%" echo ERROR: main.js was not found.
  goto FAIL
)
if not exist "index.html" (
  echo ERROR: index.html was not found.
  >>"%LOG%" echo ERROR: index.html was not found.
  goto FAIL
)


echo.
echo [3/5] Installing / repairing dependencies...
echo This can take a little while on the first launch.
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo ERROR: npm install failed. See START_GAME.log
  >>"%LOG%" echo ERROR: npm install failed with code !ERRORLEVEL!.
  goto FAIL
)


echo.
echo [4/5] Checking the JavaScript files...
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
echo JavaScript checks passed.


echo.
echo [5/5] Starting the game...
echo.
>>"%LOG%" echo Starting: npm start
call npm start >>"%LOG%" 2>&1
set "EXITCODE=%ERRORLEVEL%"
>>"%LOG%" echo Game exit code: !EXITCODE!

echo.
if not "!EXITCODE!"=="0" (
  echo ========================================================
  echo GAME CLOSED WITH ERROR CODE !EXITCODE!
  echo Full details were saved to:
  echo %LOG%
  echo ========================================================
  goto FAIL
)

echo Game closed normally.
echo.
pause
exit /b 0

:NODE_FAIL
echo.
echo ERROR: Node.js could not be installed automatically.
echo Install Node.js LTS manually from https://nodejs.org/ and run START_GAME.bat again.
>>"%LOG%" echo ERROR: Node.js installation failed or winget is unavailable.
goto FAIL

:NPM_FAIL
echo.
echo ERROR: npm was not found after Node.js installation.
>>"%LOG%" echo ERROR: npm was not found after Node.js installation.
goto FAIL

:FAIL
echo.
echo The launcher could not start the game.
echo Log file: %LOG%
echo.
pause
exit /b 1
