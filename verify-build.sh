#!/bin/bash

echo "🎃 Soul Harvest Vault - Build Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Solana
echo -n "Checking Solana CLI... "
if command -v solana &> /dev/null; then
    VERSION=$(solana --version | cut -d' ' -f2)
    echo -e "${GREEN}✓${NC} ($VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
    exit 1
fi

# Check Anchor
echo -n "Checking Anchor CLI... "
if command -v anchor &> /dev/null; then
    VERSION=$(anchor --version | cut -d' ' -f2)
    echo -e "${GREEN}✓${NC} ($VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
    exit 1
fi

# Check Node
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} ($VERSION)"
else
    echo -e "${RED}✗ Not installed${NC}"
    exit 1
fi

echo ""
echo "Checking project files..."

# Check program binary
echo -n "Program binary... "
if [ -f "target/deploy/soul_harvest_vault.so" ]; then
    SIZE=$(ls -lh target/deploy/soul_harvest_vault.so | awk '{print $5}')
    echo -e "${GREEN}✓${NC} ($SIZE)"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "Run: anchor build"
    exit 1
fi

# Check IDL
echo -n "IDL file... "
if [ -f "target/idl/soul_harvest_vault.json" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

# Check frontend
echo -n "Frontend setup... "
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    exit 1
fi

# Check frontend IDL
echo -n "Frontend IDL... "
if [ -f "frontend/public/idl/soul_harvest_vault.json" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC} Not found (will copy)"
    mkdir -p frontend/public/idl
    cp target/idl/soul_harvest_vault.json frontend/public/idl/
    echo -e "  ${GREEN}✓${NC} Copied"
fi

echo ""
echo "Checking documentation..."

DOCS=("README.md" "API_REFERENCE.md" "DYNAMIC_APY.md" "DEMO_GUIDE.md" "HACKATHON_READY.md")
for doc in "${DOCS[@]}"; do
    echo -n "$doc... "
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
done

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Build verification complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run tests:    anchor test"
echo "  2. Start frontend: cd frontend && npm install && npm run dev"
echo "  3. See demo guide: cat DEMO_GUIDE.md"
echo ""
echo "💀 The more souls, the scarier the yield! 💀"
