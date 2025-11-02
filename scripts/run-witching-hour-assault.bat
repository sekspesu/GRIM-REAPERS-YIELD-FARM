@echo off
REM 🪦 Witching Hour Assault - Execution Script (Windows)
REM Runs the comprehensive security stress test

setlocal enabledelayedexpansion

echo 🌙 Starting Witching Hour Assault Simulation...
echo.

REM Check if Anchor is installed
where anchor >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Anchor CLI not found. Please install: https://www.anchor-lang.com/docs/installation
    exit /b 1
)

echo ✅ Anchor CLI found

REM Build the program
echo.
echo 🔨 Building Soul Harvest Vault program...
call anchor build

if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Build successful

REM Check for local validator
echo.
echo 🚀 Checking for local validator...

tasklist /FI "IMAGENAME eq solana-test-validator.exe" 2>NUL | find /I /N "solana-test-validator.exe">NUL
if %errorlevel% neq 0 (
    echo ⚠️  Local validator not running. Starting...
    start /B solana-test-validator --reset
    timeout /t 5 /nobreak >nul
    echo ✅ Local validator started
) else (
    echo ✅ Local validator already running
)

REM Deploy the program
echo.
echo 📦 Deploying program to localnet...
call anchor deploy --provider.cluster localnet

if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    exit /b 1
)

echo ✅ Deployment successful

REM Run the stress test
echo.
echo ⚔️  Launching Witching Hour Assault...
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set ANCHOR_LOG=true
call anchor test --skip-local-validator tests/witching-hour-assault.ts

set TEST_RESULT=%errorlevel%

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if %TEST_RESULT% equ 0 (
    echo 🪦 VAULT SURVIVES 1M GHOST ATTACKS ✅
    echo.
    echo Security validation complete:
    echo   ✅ No double-spends detected
    echo   ✅ No negative balances
    echo   ✅ Rate limiting enforced
    echo   ✅ Vault integrity maintained
    echo   ✅ Midnight reaper operational
) else (
    echo 💀 VAULT COMPROMISED ❌
    echo.
    echo Security vulnerabilities detected!
    echo Review test output for details.
    exit /b 1
)

REM Cleanup option
echo.
set /p STOP_VALIDATOR="Stop local validator? (y/n) "
if /i "%STOP_VALIDATOR%"=="y" (
    taskkill /F /IM solana-test-validator.exe >nul 2>nul
    echo ✅ Local validator stopped
)

echo.
echo 🌙 Witching Hour Assault complete. Sleep well, the souls are safe.

endlocal
