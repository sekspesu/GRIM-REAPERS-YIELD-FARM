#!/bin/bash

# Soul Harvest Vault - Mainnet Deployment Script
# This script prepares and deploys the Grim Reaper Vault to Solana mainnet-beta

set -e

echo "🎃 GRIM REAPER VAULT - MAINNET DEPLOYMENT 🎃"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Check Solana configuration
echo "🔧 Checking Solana configuration..."
CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
echo "Current cluster: $CURRENT_CLUSTER"

if [[ "$CURRENT_CLUSTER" != *"mainnet"* ]]; then
    echo -e "${YELLOW}⚠️  Not configured for mainnet-beta${NC}"
    read -p "Switch to mainnet-beta? (yes/no): " SWITCH_CLUSTER
    if [ "$SWITCH_CLUSTER" = "yes" ]; then
        solana config set --url mainnet-beta
        echo -e "${GREEN}✅ Switched to mainnet-beta${NC}"
    else
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi
echo ""

# Check wallet balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance | awk '{print $1}')
echo "Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 5" | bc -l) )); then
    echo -e "${RED}❌ Insufficient balance. Need at least 5 SOL for deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Sufficient balance for deployment${NC}"
echo ""

# Build program
echo "🔨 Building program..."
anchor build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Get program ID
PROGRAM_KEYPAIR="target/deploy/soul_harvest_vault-keypair.json"
if [ ! -f "$PROGRAM_KEYPAIR" ]; then
    echo -e "${YELLOW}⚠️  Program keypair not found. Generating new one...${NC}"
    solana-keygen new -o "$PROGRAM_KEYPAIR" --no-bip39-passphrase
fi

PROGRAM_ID=$(solana address -k "$PROGRAM_KEYPAIR")
echo "Program ID: $PROGRAM_ID"
echo ""

# Final confirmation
echo -e "${YELLOW}⚠️  FINAL CONFIRMATION ⚠️${NC}"
echo "You are about to deploy to MAINNET-BETA"
echo "Program ID: $PROGRAM_ID"
echo "Estimated cost: ~2-5 SOL"
echo ""
read -p "Are you absolutely sure you want to proceed? (type 'DEPLOY' to confirm): " CONFIRM

if [ "$CONFIRM" != "DEPLOY" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi
echo ""

# Deploy
echo "🚀 Deploying to mainnet-beta..."
anchor deploy --provider.cluster mainnet-beta --program-name soul_harvest_vault

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📝 Deployment Information:"
    echo "=========================="
    echo "Program ID: $PROGRAM_ID"
    echo "Network: mainnet-beta"
    echo "Timestamp: $(date)"
    echo ""
    
    # Verify deployment
    echo "🔍 Verifying deployment..."
    solana program show "$PROGRAM_ID"
    echo ""
    
    echo -e "${GREEN}🎉 GRIM REAPER VAULT IS LIVE! 🎉${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Initialize the program (run scripts/initialize-mainnet.ts)"
    echo "2. Verify program on Solana explorers"
    echo "3. Update frontend with program ID: $PROGRAM_ID"
    echo "4. Set up monitoring"
    echo ""
    echo "💀 May the yields be ever in your favor! 💀"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
