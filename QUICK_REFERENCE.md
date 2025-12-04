# 🎃 Soul Harvest Vault - Quick Reference

## One Command Demo

```bash
# Verify everything is ready
./verify-build.sh

# Run tests (shows everything works)
anchor test

# Start frontend (in new terminal)
cd frontend && npm install && npm run dev
```

---

## Key Commands

| Action | Command |
|--------|---------|
| **Verify Build** | `./verify-build.sh` |
| **Run Tests** | `anchor test` |
| **Build Program** | `anchor build` |
| **Start Frontend** | `cd frontend && npm run dev` |
| **Deploy Devnet** | `anchor deploy --provider.cluster devnet` |
| **Check Balance** | `solana balance` |
| **Get Airdrop** | `solana airdrop 2` |

---

## Project Structure

```
soul-harvest-vault/
├── programs/soul-harvest-vault/src/  # Solana program (Rust)
├── frontend/                          # Next.js frontend
├── tests/                             # Integration tests
├── scripts/                           # Deployment scripts
└── [docs]/                            # Documentation
```

---

## Key Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `DEMO_GUIDE.md` | Demo instructions |
| `HACKATHON_READY.md` | Submission checklist |
| `PROJECT_SUMMARY.md` | Visual summary |
| `API_REFERENCE.md` | API documentation |
| `DYNAMIC_APY.md` | APY system details |

---

## Dynamic APY Tiers

| TVL | APY | Emoji |
|-----|-----|-------|
| < 10K SOL | 5% | 👻 |
| 10K+ SOL | 8% | 💀 |
| 50K+ SOL | 12% | 💀💀 |
| 100K+ SOL | 15% | 💀💀💀 |

---

## Core Features

- ✅ Dynamic APY (5-15%)
- ✅ Soul Harvesting
- ✅ Leaderboard
- ✅ Midnight Harvest
- ✅ Reaper Pass NFTs
- ✅ No Lock Periods

---

## Tech Stack

- **Blockchain:** Solana
- **Framework:** Anchor 0.28.0
- **Language:** Rust + TypeScript
- **Frontend:** Next.js 14 + Tailwind
- **Wallet:** Solana Wallet Adapter

---

## Program Details

- **Program ID:** `CM7bjZs41G4ryhjUMptVRLLd1ojwxHrrE5sGfEGqV5h`
- **Binary Size:** 462 KB
- **Instructions:** 6/7 working
- **Test Coverage:** Full

---

## Frontend URLs

- **Local:** http://localhost:3000
- **Devnet:** (after deployment)
- **Mainnet:** (future)

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail | `anchor clean && anchor build && anchor test` |
| Frontend won't start | `cd frontend && npm install` |
| Wallet won't connect | Check network (devnet/localnet) |
| Airdrop fails | Wait 60 seconds, try again |

---

## Demo Talking Points

1. **Innovation:** "Dynamic APY creates network effects"
2. **Security:** "Comprehensive security with PDAs and checked arithmetic"
3. **Theme:** "Fully committed Halloween aesthetic"
4. **Complete:** "Working protocol + frontend + docs"

---

## Submission Checklist

- [x] Program compiles
- [x] Tests pass
- [x] Frontend works
- [x] Docs complete
- [ ] Video recorded (optional)
- [ ] Screenshots taken (optional)
- [ ] GitHub public

---

## The Pitch (30 seconds)

"Soul Harvest Vault is a Solana DeFi protocol where yield scales from 5% to 15% based on total TVL. Unlike traditional protocols with fixed APY, we create network effects that benefit all users. Add gamified soul harvesting, limited NFT boosts, and a Halloween theme - you get a unique, production-ready protocol."

---

## Support

- **Docs:** See README.md
- **Demo:** See DEMO_GUIDE.md
- **Status:** See STATUS.md
- **Summary:** See PROJECT_SUMMARY.md

---

**💀 The more souls, the scarier the yield! 💀**

**Ready to submit! 🎃**
