#!/bin/bash

# 🪦 Witching Hour Assault - Execution Script
# Runs the comprehensive security stress test

set -e

echo "🌙 Starting Witching Hour Assault Simulation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found. Please install: https://www.anchor-lang.com/docs/installation${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Anchor CLI found${NC}"

# Build the program
echo ""
echo "🔨 Building Soul Harvest Vault program..."
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Start local validator if not running
echo ""
echo "🚀 Checking for local validator..."

if ! pgrep -x "solana-test-validator" > /dev/null; then
    echo -e "${YELLOW}⚠️  Local validator not running. Starting...${NC}"
    solana-test-validator --reset &
    VALIDATOR_PID=$!
    sleep 5
    echo -e "${GREEN}✅ Local validator started (PID: $VALIDATOR_PID)${NC}"
else
    echo -e "${GREEN}✅ Local validator already running${NC}"
fi

# Deploy the program
echo ""
echo "📦 Deploying program to localnet..."
anchor deploy --provider.cluster localnet

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful${NC}"

# Run the stress test
echo ""
echo "⚔️  Launching Witching Hour Assault..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ANCHOR_LOG=true anchor test --skip-local-validator tests/witching-hour-assault.ts

TEST_RESULT=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}🪦 VAULT SURVIVES 1M GHOST ATTACKS ✅${NC}"
    echo ""
    echo "Security validation complete:"
    echo "  ✅ No double-spends detected"
    echo "  ✅ No negative balances"
    echo "  ✅ Rate limiting enforced"
    echo "  ✅ Vault integrity maintained"
    echo "  ✅ Midnight reaper operational"
else
    echo -e "${RED}💀 VAULT COMPROMISED ❌${NC}"
    echo ""
    echo "Security vulnerabilities detected!"
    echo "Review test output for details."
    exit 1
fi

# Cleanup option
echo ""
read -p "Stop local validator? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -z "$VALIDATOR_PID" ]; then
        kill $VALIDATOR_PID
        echo -e "${GREEN}✅ Local validator stopped${NC}"
    else
        pkill -x "solana-test-validator"
        echo -e "${GREEN}✅ Local validator stopped${NC}"
    fi
fi

echo ""
echo "🌙 Witching Hour Assault complete. Sleep well, the souls are safe."
