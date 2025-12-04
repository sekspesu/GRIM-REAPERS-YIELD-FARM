#!/bin/bash
# Simple installation script with fallbacks

echo "🎃 Soul Harvest Vault - Quick Setup"
echo ""

# Step 1: Install Homebrew if not present
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed"
fi

# Step 2: Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Step 3: Install Solana
if ! command -v solana &> /dev/null; then
    echo "📦 Installing Solana CLI..."
    brew install solana
else
    echo "✅ Solana already installed: $(solana --version)"
fi

# Step 4: Install Anchor
if ! command -v anchor &> /dev/null; then
    echo "📦 Installing Anchor (this takes a few minutes)..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
else
    echo "✅ Anchor already installed: $(anchor --version)"
fi

# Step 5: Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Run these commands to test:"
echo "  anchor build"
echo "  anchor test"
