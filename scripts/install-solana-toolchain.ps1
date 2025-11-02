# Soul Harvest Vault - Toolchain Setup (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Soul Harvest Vault - Toolchain Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Rust is installed
Write-Host "[1/4] Checking Rust installation..." -ForegroundColor Yellow
try {
    $rustVersion = rustc --version 2>&1
    Write-Host "✓ Rust is installed: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Rust is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Rust from: https://rustup.rs/" -ForegroundColor Yellow
    Write-Host "After installation, restart this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check if Solana is installed
Write-Host "[2/4] Checking Solana CLI installation..." -ForegroundColor Yellow
try {
    $solanaVersion = solana --version 2>&1
    Write-Host "✓ Solana CLI is installed: $solanaVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Solana CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Solana CLI..." -ForegroundColor Yellow
    
    # Download and run Solana installer
    $installerPath = "$env:TEMP\solana-installer.exe"
    try {
        Invoke-WebRequest -Uri "https://release.solana.com/v1.17.0/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile $installerPath
        Start-Process -FilePath $installerPath -Wait
        Remove-Item $installerPath
        
        Write-Host ""
        Write-Host "Solana installed! Please restart your terminal and run this script again." -ForegroundColor Green
        Read-Host "Press Enter to exit"
        exit 0
    } catch {
        Write-Host "Failed to download/install Solana" -ForegroundColor Red
        Write-Host "Please install manually from: https://docs.solana.com/cli/install-solana-cli-tools" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host ""

# Check if Anchor is installed
Write-Host "[3/4] Checking Anchor installation..." -ForegroundColor Yellow
try {
    $anchorVersion = anchor --version 2>&1
    Write-Host "✓ Anchor is installed: $anchorVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Anchor is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Anchor via cargo..." -ForegroundColor Yellow
    
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Anchor" -ForegroundColor Red
        Write-Host "Please install manually from: https://www.anchor-lang.com/docs/installation" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host ""

# Install Node dependencies
Write-Host "[4/4] Installing Node.js dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Node dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install Node dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Warning: package.json not found" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run:" -ForegroundColor Yellow
Write-Host "  anchor build    - Build the program" -ForegroundColor White
Write-Host "  anchor test     - Run tests" -ForegroundColor White
Write-Host "  anchor deploy   - Deploy to configured cluster" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
