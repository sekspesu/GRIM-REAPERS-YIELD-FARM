#!/bin/bash

# Soul Harvest Vault - Development Environment Setup Script
# For macOS

set -e

echo "🎃 Setting up Soul Harvest Vault development environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Rust is installed
echo "📦 Checking Rust installation..."
if command -v rustc &> /dev/null; then
    echo -e "${GREEN}✓ Rust is already installed: $(rustc --version)${NC}"
else
    echo -e "${YELLOW}Installing Rust...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    echo -e "${GREEN}✓ Rust installed successfully${NC}"
fi

# Ensure cargo is in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Check if Solana is installed
echo ""
echo "⚡ Checking Solana CLI installation..."
if command -v solana &> /dev/null; then
    echo -e "${GREEN}✓ Solana CLI is already installed: $(solana --version)${NC}"
else
    echo -e "${YELLOW}Installing Solana CLI...${NC}"
    
    # Try multiple methods
    if sh -c "$(curl -sSfL https://release.solana.com/stable/install)" 2>/dev/null; then
        echo -e "${GREEN}✓ Solana CLI installed via official installer${NC}"
    elif brew install solana 2>/dev/null; then
        echo -e "${GREEN}✓ Solana CLI installed via Homebrew${NC}"
    else
        echo -e "${RED}✗ Failed to install Solana CLI${NC}"
        echo "Please try manually:"
        echo "  1. Using Homebrew: brew install solana"
        echo "  2. Or visit: https://docs.solana.com/cli/install-solana-cli-tools"
        exit 1
    fi
    
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

# Check if Anchor is installed
echo ""
echo "⚓ Checking Anchor installation..."
if command -v anchor &> /dev/null; then
    echo -e "${GREEN}✓ Anchor is already installed: $(anchor --version)${NC}"
else
    echo -e "${YELLOW}Installing Anchor (this may take a few minutes)...${NC}"
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    echo -e "${GREEN}✓ Anchor installed successfully${NC}"
fi

# Install Node dependencies
echo ""
echo "📚 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Node dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ No package.json found, skipping npm install${NC}"
fi

# Add to shell profile
echo ""
echo "🔧 Updating shell configuration..."
SHELL_PROFILE="$HOME/.zshrc"

# Add Solana to PATH if not already there
if ! grep -q "solana/install/active_release/bin" "$SHELL_PROFILE" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> "$SHELL_PROFILE"
    echo -e "${GREEN}✓ Added Solana to PATH in $SHELL_PROFILE${NC}"
fi

# Add Cargo to PATH if not already there
if ! grep -q ".cargo/bin" "$SHELL_PROFILE" 2>/dev/null; then
    echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> "$SHELL_PROFILE"
    echo -e "${GREEN}✓ Added Cargo to PATH in $SHELL_PROFILE${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Reload your shell: source ~/.zshrc"
echo "  2. Build the program: anchor build"
echo "  3. Run tests: anchor test"
echo ""
echo "Or run all at once:"
echo "  source ~/.zshrc && anchor build && anchor test"
