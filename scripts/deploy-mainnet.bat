@echo off
REM Soul Harvest Vault - Mainnet Deployment Script (Windows)
REM This script prepares and deploys the Grim Reaper Vault to Solana mainnet-beta

echo.
echo 🎃 GRIM REAPER VAULT - MAINNET DEPLOYMENT 🎃
echo ==============================================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

where solana >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Solana CLI not found. Please install it first.
    exit /b 1
)

where anchor >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Anchor CLI not found. Please install it first.
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Check Solana configuration
echo 🔧 Checking Solana configuration...
for /f "tokens=3" %%a in ('solana config get ^| findstr "RPC URL"') do set CURRENT_CLUSTER=%%a
echo Current cluster: %CURRENT_CLUSTER%

echo %CURRENT_CLUSTER% | findstr /C:"mainnet" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Not configured for mainnet-beta
    set /p SWITCH_CLUSTER="Switch to mainnet-beta? (yes/no): "
    if /i "%SWITCH_CLUSTER%"=="yes" (
        solana config set --url mainnet-beta
        echo ✅ Switched to mainnet-beta
    ) else (
        echo ❌ Deployment cancelled
        exit /b 1
    )
)
echo.

REM Check wallet balance
echo 💰 Checking wallet balance...
for /f "tokens=1" %%a in ('solana balance') do set BALANCE=%%a
echo Current balance: %BALANCE% SOL
echo.

REM Build program
echo 🔨 Building program...
call anchor build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Build complete
echo.

REM Get program ID
set PROGRAM_KEYPAIR=target\deploy\soul_harvest_vault-keypair.json
if not exist "%PROGRAM_KEYPAIR%" (
    echo ⚠️  Program keypair not found. Generating new one...
    solana-keygen new -o "%PROGRAM_KEYPAIR%" --no-bip39-passphrase
)

for /f %%a in ('solana address -k "%PROGRAM_KEYPAIR%"') do set PROGRAM_ID=%%a
echo Program ID: %PROGRAM_ID%
echo.

REM Final confirmation
echo ⚠️  FINAL CONFIRMATION ⚠️
echo You are about to deploy to MAINNET-BETA
echo Program ID: %PROGRAM_ID%
echo Estimated cost: ~2-5 SOL
echo.
set /p CONFIRM="Are you absolutely sure you want to proceed? (type 'DEPLOY' to confirm): "

if /i not "%CONFIRM%"=="DEPLOY" (
    echo ❌ Deployment cancelled
    exit /b 1
)
echo.

REM Deploy
echo 🚀 Deploying to mainnet-beta...
call anchor deploy --provider.cluster mainnet-beta --program-name soul_harvest_vault

if %ERRORLEVEL% EQU 0 (
    echo ✅ Deployment successful!
    echo.
    echo 📝 Deployment Information:
    echo ==========================
    echo Program ID: %PROGRAM_ID%
    echo Network: mainnet-beta
    echo Timestamp: %date% %time%
    echo.
    
    echo 🔍 Verifying deployment...
    solana program show %PROGRAM_ID%
    echo.
    
    echo 🎉 GRIM REAPER VAULT IS LIVE! 🎉
    echo.
    echo Next steps:
    echo 1. Initialize the program (run scripts/initialize-mainnet.ts)
    echo 2. Verify program on Solana explorers
    echo 3. Update frontend with program ID: %PROGRAM_ID%
    echo 4. Set up monitoring
    echo.
    echo 💀 May the yields be ever in your favor! 💀
) else (
    echo ❌ Deployment failed
    exit /b 1
)
