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
>>"%LOG%" node --version 2>&1

echo.
echo [2/4] Checking game files...
for %%F in (package.json server.js index.html game.js styles.css) do if not exist "%%F" goto PROJECT_FAIL
echo Game files: OK

echo.
echo [3/4] Checking JavaScript syntax...
node --check server.js >nul 2>&1
if errorlevel 1 goto SERVER_SYNTAX_FAIL
node --check game.js >nul 2>&1
if errorlevel 1 goto GAME_SYNTAX_FAIL
echo JavaScript: OK

echo.
echo [4/4] Starting local browser server...
echo.
echo Opening: http://127.0.0.1:4173/
echo Keep this window open while playing.
echo Close this window to stop the server.
echo.
>>"%LOG%" echo Running: node server.js
node server.js >>"%LOG%" 2>&1
set "EXITCODE=%ERRORLEVEL%"
>>"%LOG%" echo Server exit code: %EXITCODE%
if not "%EXITCODE%"=="0" goto SERVER_FAIL
exit /b 0

:NODE_FAIL
echo ERROR: Node.js was not found in PATH.
echo Install Node.js LTS, then run START_GAME.bat again.
>>"%LOG%" echo ERROR: node command not found.
goto FAIL

:PROJECT_FAIL
echo ERROR: One or more game files are missing.
echo Make sure START_GAME.bat is in the project root.
>>"%LOG%" echo ERROR: required game file missing.
goto FAIL

:SERVER_SYNTAX_FAIL
echo ERROR: server.js contains a syntax error.
node --check server.js
>>"%LOG%" node --check server.js 2>&1
goto FAIL

:GAME_SYNTAX_FAIL
echo ERROR: game.js contains a syntax error.
node --check game.js
>>"%LOG%" node --check game.js 2>&1
goto FAIL

:SERVER_FAIL
echo.
echo ========================================================
echo GAME SERVER STOPPED WITH ERROR !EXITCODE!
echo See START_GAME.log for details.
echo ========================================================
goto FAIL

:FAIL
echo.
echo Launcher stopped.
echo Log file: %LOG%
pause
exit /b 1
