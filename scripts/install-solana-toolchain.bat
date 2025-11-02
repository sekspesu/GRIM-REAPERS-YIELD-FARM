@echo off
echo ========================================
echo Soul Harvest Vault - Toolchain Setup
echo ========================================
echo.

REM Check if Rust is installed
echo [1/4] Checking Rust installation...
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Rust is not installed.
    echo Please install Rust from: https://rustup.rs/
    echo.
    echo After installation, restart this script.
    pause
    exit /b 1
) else (
    echo ✓ Rust is installed
    rustc --version
)
echo.

REM Check if Solana is installed
echo [2/4] Checking Solana CLI installation...
solana --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Solana CLI is not installed.
    echo.
    echo Installing Solana CLI...
    echo Please follow the prompts...
    echo.
    
    REM Download and run Solana installer
    powershell -Command "& {Invoke-WebRequest -Uri 'https://release.solana.com/v1.17.0/solana-install-init-x86_64-pc-windows-msvc.exe' -OutFile '%TEMP%\solana-installer.exe'}"
    
    if exist "%TEMP%\solana-installer.exe" (
        start /wait %TEMP%\solana-installer.exe
        del "%TEMP%\solana-installer.exe"
        
        echo.
        echo Solana installed! Please restart your terminal and run this script again.
        pause
        exit /b 0
    ) else (
        echo Failed to download Solana installer.
        echo Please install manually from: https://docs.solana.com/cli/install-solana-cli-tools
        pause
        exit /b 1
    )
) else (
    echo ✓ Solana CLI is installed
    solana --version
)
echo.

REM Check if Anchor is installed
echo [3/4] Checking Anchor installation...
anchor --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Anchor is not installed.
    echo.
    echo Installing Anchor via cargo...
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    
    if %errorlevel% neq 0 (
        echo Failed to install Anchor.
        echo Please install manually from: https://www.anchor-lang.com/docs/installation
        pause
        exit /b 1
    )
) else (
    echo ✓ Anchor is installed
    anchor --version
)
echo.

REM Install Node dependencies
echo [4/4] Installing Node.js dependencies...
if exist "package.json" (
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install Node dependencies.
        pause
        exit /b 1
    )
    echo ✓ Node dependencies installed
) else (
    echo Warning: package.json not found
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo You can now run:
echo   anchor build    - Build the program
echo   anchor test     - Run tests
echo   anchor deploy   - Deploy to configured cluster
echo.
pause
