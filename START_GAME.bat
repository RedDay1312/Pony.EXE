@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title MY LITTLE PONY - THE LAST SAVE
chcp 65001 >nul
color 0A

echo.
echo ========================================================
echo        MY LITTLE PONY: THE LAST SAVE
echo                 Friendship was never deleted.
echo ========================================================
echo.
echo [1/4] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed.
    echo Install Node.js 22 LTS from https://nodejs.org/ and run this file again.
    echo.
    pause
    exit /b 1
)
node --version

echo.
echo [2/4] Checking npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm was not found in PATH.
    echo Reinstall Node.js 22 LTS and make sure npm is enabled.
    pause
    exit /b 1
)
npm --version

echo.
echo [3/4] Installing / updating dependencies...
if not exist "node_modules" (
    call npm install
) else (
    echo node_modules already exists. Verifying dependencies...
    call npm install
)
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    echo Check your internet connection and Node.js installation.
    pause
    exit /b 1
)

echo.
echo [4/4] Starting THE LAST SAVE...
echo.
call npm start
set "EXITCODE=%ERRORLEVEL%"

echo.
if not "%EXITCODE%"=="0" (
    echo The game closed with error code %EXITCODE%.
) else (
    echo The game has been closed.
)
pause
exit /b %EXITCODE%
