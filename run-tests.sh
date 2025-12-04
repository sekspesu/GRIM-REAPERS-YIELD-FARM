#!/bin/bash

# Soul Harvest Vault - Test Runner
# This script sets up the environment and runs tests

echo "🎃 Soul Harvest Vault - Running Tests"
echo ""

# Add Solana to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Find and add Node to PATH
if [ -d "/opt/homebrew/bin" ]; then
    export PATH="/opt/homebrew/bin:$PATH"
fi

if [ -d "$HOME/.nvm" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found in PATH"
    echo "Please install Node.js or add it to your PATH"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ Solana: $(solana --version | head -1)"
echo "✅ Anchor: $(anchor --version)"
echo ""

# Run tests
echo "Running Anchor tests..."
anchor test --skip-build

echo ""
echo "Tests complete!"
