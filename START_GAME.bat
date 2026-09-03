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

echo [1/3] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 goto NODE_FAIL
for /f "delims=" %%V in ('node --version 2^>nul') do echo Node.js: %%V


echo.
echo [2/3] Checking game files...
if not exist "package.json" goto PROJECT_FAIL
if not exist "server.js" goto PROJECT_FAIL
if not exist "index.html" goto PROJECT_FAIL
if not exist "game.js" goto PROJECT_FAIL
if not exist "styles.css" goto PROJECT_FAIL
echo Game files: OK


echo.
echo [3/3] Starting local browser server...
echo.
echo Opening: http://127.0.0.1:4173/
echo Keep this window open while playing.
echo Close this window to stop the game server.
echo.
>>"%LOG%" echo Running: node server.js
node server.js >>"%LOG%" 2>&1
set "EXITCODE=%ERRORLEVEL%"
>>"%LOG%" echo Server exit code: %EXITCODE%

if not "%EXITCODE%"=="0" (
  echo.
  echo ========================================================
  echo GAME SERVER STOPPED WITH ERROR !EXITCODE!
  echo See START_GAME.log for details.
  echo ========================================================
  pause
  exit /b 1
)
exit /b 0

:NODE_FAIL
echo ERROR: Node.js was not found in PATH.
echo Install Node.js LTS, then run START_GAME.bat again.
>>"%LOG%" echo ERROR: node command not found.
pause
exit /b 1

:PROJECT_FAIL
echo ERROR: One or more game files are missing.
echo Make sure START_GAME.bat is in the project root.
>>"%LOG%" echo ERROR: required project file missing.
pause
exit /b 1
