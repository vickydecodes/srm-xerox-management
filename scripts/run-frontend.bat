@echo off
setlocal EnableExtensions

for /F %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"
set "GREEN=%ESC%[1;32m"
set "YELLOW=%ESC%[1;33m"
set "CYAN=%ESC%[1;36m"
set "RED=%ESC%[1;31m"
set "RESET=%ESC%[0m"

cd /d "%~dp0..\frontend"

echo %CYAN%=== FRONTEND ===%RESET%

if not exist "node_modules" (
    echo %YELLOW%⚠ node_modules not found. Installing dependencies for FRONTEND...%RESET%
    call npm install
    if errorlevel 1 (
        echo %RED%✖ FRONTEND npm install failed.%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%✔ FRONTEND dependencies installed.%RESET%
) else (
    echo %GREEN%✔ FRONTEND dependencies already present.%RESET%
)

echo %CYAN%▶ Starting FRONTEND (npm run dev)...%RESET%
call npm run dev

echo %RED%FRONTEND process exited.%RESET%
pause