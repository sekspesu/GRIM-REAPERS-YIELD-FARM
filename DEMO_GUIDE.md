# Soul Harvest Vault - Demo Guide

## 🎃 Quick Demo

This guide will help you demo the Soul Harvest Vault protocol for the Kiroween hackathon.

## Prerequisites

- Solana CLI installed
- Anchor CLI installed
- Node.js 18+
- Phantom wallet (for frontend demo)

## Option 1: Local Testing (Fastest)

### 1. Start Local Validator

```bash
# Terminal 1
solana-test-validator
```

### 2. Run Tests

```bash
# Terminal 2
anchor test --skip-local-validator
```

This will:
- ✅ Initialize the program
- ✅ Create a vault
- ✅ Compound rewards
- ✅ Withdraw tokens
- ✅ Display dynamic APY

### 3. Start Frontend

```bash
# Terminal 3
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and connect your wallet!

## Option 2: Devnet Deployment

### 1. Configure Devnet

```bash
solana config set --url devnet
solana airdrop 2
# Wait 30 seconds
solana airdrop 2
```

### 2. Deploy Program

```bash
anchor deploy --provider.cluster devnet
```

### 3. Initialize Program

```bash
ts-node scripts/initialize-mainnet.ts
```

### 4. Update Frontend

Edit `frontend/components/VaultDashboard.tsx`:
- Change network to `WalletAdapterNetwork.Devnet`
- Verify PROGRAM_ID matches deployed program

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo Flow

### 1. Show the Concept

**"Soul Harvest Vault - Where Fear Drives Yield"**

- DeFi protocol on Solana
- Dynamic APY (5-15%) based on total TVL
- The more souls (TVL) locked, the higher the yield for everyone
- Creates positive network effects

### 2. Show the Code

**Key Innovation: Dynamic APY**

```rust
// From compound.rs
let tvl_in_sol = config.total_tvl / 1_000_000_000;
let current_apy = if tvl_in_sol >= 100_000 {
    1500 // 15%
} else if tvl_in_sol >= 50_000 {
    1200 // 12%
} else if tvl_in_sol >= 10_000 {
    800  // 8%
} else {
    500  // 5%
};
```

### 3. Show the Tests

```bash
anchor test
```

Point out:
- ✅ All core features working
- ✅ Dynamic APY calculation
- ✅ Soul harvesting mechanics
- ✅ Leaderboard system

### 4. Show the Frontend

Open http://localhost:3000

- 💀 Dynamic APY display with Fear Index
- 🎃 Create vault interface
- 🔄 Compound rewards button
- 🏆 Leaderboard
- 🌙 Halloween theme throughout

### 5. Show the Features

**Core DeFi:**
- Create vaults with any SPL token
- Compound rewards anytime
- Withdraw anytime (no lock period)
- Close vaults to reclaim rent

**Gamification:**
- Soul harvesting (earn souls per compound)
- Leaderboard (compete by TVL)
- Reaper Pass NFTs (2x boost, limited to 1666)
- Midnight harvest automation

**Innovation:**
- Dynamic APY creates network effects
- Early adopters benefit as protocol grows
- Charity component (1% to Solana Foundation)
- Halloween theme fully integrated

## Key Talking Points

### 1. Technical Excellence

- Built with Anchor (industry standard)
- Comprehensive security (checked arithmetic, PDAs, rate limiting)
- Production-ready code
- Well-documented

### 2. Innovation

**Dynamic APY is the key differentiator:**
- Most DeFi protocols have fixed APY
- We scale APY with TVL (5% → 15%)
- Creates positive feedback loop
- Incentivizes growth and early adoption

### 3. Theme Execution

- "Soul harvesting" instead of "yield farming"
- "Fear Index" for APY levels
- "Reaper Pass" NFTs
- "Midnight harvest" automation
- Fully committed Halloween aesthetic

### 4. Community Appeal

- Charity component (1% to Solana Foundation)
- Leaderboard creates competition
- Limited NFT supply creates scarcity
- Network effects benefit everyone

## Demo Script

**Opening (30 seconds):**
"Soul Harvest Vault is a Solana DeFi protocol where fear drives yield. Unlike traditional protocols with fixed APY, our yield scales from 5% to 15% based on total TVL. The more souls locked in the vaults, the scarier the yield becomes for everyone."

**Technical Demo (2 minutes):**
1. Show the code structure
2. Run the tests
3. Point out dynamic APY calculation
4. Show security features

**Frontend Demo (2 minutes):**
1. Connect wallet
2. Show APY display with current TVL
3. Create a vault
4. Compound rewards
5. Show leaderboard

**Innovation Highlight (1 minute):**
"The key innovation is the dynamic APY system. It creates network effects - early users benefit as more people join. This incentivizes growth and creates a positive feedback loop that most DeFi protocols lack."

**Closing (30 seconds):**
"We've built a production-ready DeFi protocol with unique mechanics, strong security, and a fun Halloween theme. The more souls, the scarier the yield! 💀"

## Screenshots to Capture

1. **APY Display** - Show the Fear Index with different TVL levels
2. **Vault Interface** - Create vault and compound buttons
3. **Leaderboard** - Top users by TVL
4. **Test Results** - All tests passing
5. **Code Snippet** - Dynamic APY calculation

## Video Demo Outline

**0:00-0:15** - Title card and concept intro
**0:15-1:00** - Code walkthrough (dynamic APY)
**1:00-2:00** - Test execution
**2:00-3:30** - Frontend demo
**3:30-4:00** - Innovation summary and closing

## Troubleshooting

### Tests Failing

```bash
# Clean and rebuild
anchor clean
anchor build
anchor test
```

### Frontend Not Connecting

- Check wallet is on correct network (devnet/localnet)
- Verify PROGRAM_ID matches deployed program
- Check IDL file is in `frontend/public/idl/`

### Devnet Faucet Rate Limit

```bash
# Wait 30-60 seconds between airdrops
solana airdrop 2
sleep 60
solana airdrop 2
```

## Resources

- **GitHub**: [Your repo URL]
- **Docs**: See README.md, API_REFERENCE.md, DYNAMIC_APY.md
- **Anchor**: https://www.anchor-lang.com/
- **Solana**: https://docs.solana.com/

---

**💀 The more souls, the scarier the yield! 💀**

Good luck with the hackathon! 🎃
