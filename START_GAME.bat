@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title MY LITTLE PONY - THE LAST SAVE
chcp 65001 >nul 2>&1
color 0A

set "LOG=%~dp0START_GAME.log"
>"%LOG%" echo THE LAST SAVE browser launcher started: %date% %time%

cls
echo.
echo ========================================================
echo        MY LITTLE PONY: THE LAST SAVE
echo          Friendship was never deleted.
echo ========================================================
echo.

echo [1/4] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 goto NODE_FAIL
for /f "delims=" %%V in ('node --version 2^>nul') do echo Node.js: %%V


echo.
echo [2/4] Checking project files...
if not exist "package.json" goto PROJECT_FAIL
if not exist "server.js" goto PROJECT_FAIL
if not exist "index.html" goto PROJECT_FAIL
if not exist "game.js" goto PROJECT_FAIL
if not exist "styles.css" goto PROJECT_FAIL
echo Project files: OK


echo.
echo [3/4] Checking dependencies...
if not exist "node_modules" (
  echo Installing the small local server dependency tree...
  call npm install --no-audit --no-fund --progress=false --loglevel=warn
  if errorlevel 1 goto INSTALL_FAIL
) else (
  echo Dependencies already installed. Skipping npm install.
)


echo.
echo [4/4] Starting local browser game...
echo.
echo The game will open automatically in your default browser.
echo URL: http://127.0.0.1:4173/
echo.
>>"%LOG%" echo Starting npm start
call npm start >>"%LOG%" 2>&1
set "EXITCODE=%ERRORLEVEL%"
>>"%LOG%" echo Server exit code: %EXITCODE%
if not "%EXITCODE%"=="0" goto RUN_FAIL
pause
exit /b 0

:NODE_FAIL
echo ERROR: Node.js was not found in PATH.
echo Install Node.js LTS, then run START_GAME.bat again.
>>"%LOG%" echo ERROR: node command not found.
pause
exit /b 1

:PROJECT_FAIL
echo ERROR: The project is incomplete. Required files are missing.
>>"%LOG%" echo ERROR: required project file missing.
pause
exit /b 1

:INSTALL_FAIL
echo ERROR: npm could not prepare the local server.
echo See START_GAME.log for details.
>>"%LOG%" echo ERROR: npm install failed with code %ERRORLEVEL%.
pause
exit /b 1

:RUN_FAIL
echo ERROR: The local game server stopped unexpectedly.
echo See START_GAME.log for details.
pause
exit /b 1
