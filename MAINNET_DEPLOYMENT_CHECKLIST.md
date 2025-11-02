# 🎃 Grim Reaper Vault - Mainnet Deployment Checklist

## Pre-Deployment (Complete Before Launch)

### Code & Testing
- [ ] All tests passing on localnet
- [ ] All tests passing on devnet
- [ ] Security audit completed (recommended)
- [ ] Code review by team members
- [ ] Edge cases tested (witching hour, rate limits, etc.)
- [ ] Simulation tests validated

### Configuration
- [ ] Program ID generated and saved securely
- [ ] Program ID updated in lib.rs
- [ ] Program ID updated in Anchor.toml
- [ ] Rebuild after program ID update
- [ ] Verify build artifacts match

### Wallet & Funds
- [ ] Deployment wallet funded with 5-10 SOL
- [ ] Authority wallet secured (hardware wallet recommended)
- [ ] Backup all keypairs securely (encrypted, multiple locations)
- [ ] Test wallet access before deployment

### Documentation
- [ ] API documentation complete
- [ ] Frontend integration guide ready
- [ ] User documentation prepared
- [ ] Admin procedures documented

## Deployment Day

### Step 1: Final Verification (30 min before)
- [ ] Run full test suite one more time
- [ ] Verify Solana network status (no outages)
- [ ] Confirm deployment wallet balance
- [ ] Team members on standby

### Step 2: Deploy Program
```bash
# Windows
scripts\deploy-mainnet.bat

# Linux/Mac
chmod +x scripts/deploy-mainnet.sh
./scripts/deploy-mainnet.sh
```

- [ ] Deployment transaction confirmed
- [ ] Program ID verified on explorer
- [ ] Save deployment transaction signature

### Step 3: Initialize Program
```bash
# Set cluster to mainnet
solana config set --url mainnet-beta

# Run initialization
ts-node scripts/initialize-mainnet.ts
```

- [ ] Initialization transaction confirmed
- [ ] Config PDA created successfully
- [ ] Reaper Pass mint created
- [ ] Parameters verified (APY, boost, etc.)

### Step 4: Verification
- [ ] Check program on Solscan: https://solscan.io/
- [ ] Check program on Solana Explorer
- [ ] Verify config account data
- [ ] Test deposit with small amount
- [ ] Test withdrawal
- [ ] Test Reaper Pass minting (if applicable)

### Step 5: Frontend Deployment
- [ ] Update frontend with program ID
- [ ] Update frontend with config PDA
- [ ] Update frontend with Reaper mint
- [ ] Deploy frontend to production
- [ ] Test frontend end-to-end

## Post-Deployment

### Immediate (Within 1 hour)
- [ ] Set up monitoring alerts
- [ ] Monitor first transactions
- [ ] Check for any errors in logs
- [ ] Verify TVL tracking
- [ ] Test all user flows

### First 24 Hours
- [ ] Monitor transaction success rate
- [ ] Check for any unexpected behavior
- [ ] Respond to user questions
- [ ] Monitor social media mentions
- [ ] Track TVL growth

### First Week
- [ ] Daily monitoring of key metrics
- [ ] User feedback collection
- [ ] Performance optimization if needed
- [ ] Community engagement
- [ ] Bug fixes if necessary

## Marketing & Announcements

### Pre-Launch (1 week before)
- [ ] Teaser posts on social media
- [ ] Community announcements
- [ ] Influencer outreach
- [ ] Documentation published

### Launch Day
- [ ] Official announcement tweet
- [ ] Discord announcement
- [ ] Telegram announcement
- [ ] Reddit post
- [ ] Medium article (optional)

### Post-Launch
- [ ] Daily updates on TVL/stats
- [ ] User testimonials
- [ ] Educational content
- [ ] Partnership announcements

## Your Specific Launch Plan

### Tweet Template
```
💀 GRIM REAPER VAULT IS LIVE

Deposit before midnight UTC or your yields become ghosts.

$30k Kiroween Grand Prize Entry

https://reaper.farm

#Kiroween #Solana
```

### Livestream Details
- **Time**: 9:00am PT
- **Title**: "Building the Midnight Yield Farm in Kiro IDE – Watch the Reaper Rise"
- **Platform**: [Your platform]
- **Topics to cover**:
  - Program architecture
  - Witching hour mechanics
  - Dynamic APY system
  - Reaper Pass benefits
  - Live deployment walkthrough
  - Q&A

## Emergency Procedures

### If Deployment Fails
1. Check error message carefully
2. Verify wallet balance
3. Check network status
4. Review deployment logs
5. Contact Solana support if needed

### If Bug Found Post-Deployment
1. Assess severity immediately
2. Pause program if critical (use pause instruction)
3. Notify users transparently
4. Prepare fix and test thoroughly
5. Deploy upgrade
6. Resume operations

### If Exploit Detected
1. **IMMEDIATELY** pause the program
2. Assess damage and affected users
3. Prepare emergency communication
4. Work on fix with security experts
5. Plan compensation if needed
6. Deploy fix with audit
7. Post-mortem and improvements

## Contact Information

### Support Channels
- Discord: [Your Discord]
- Telegram: [Your Telegram]
- Twitter: [Your Twitter]
- Email: [Your Email]

### Emergency Contacts
- Lead Developer: [Contact]
- Security Team: [Contact]
- Community Manager: [Contact]

## Important Links

### Explorers
- Solscan: https://solscan.io/account/[PROGRAM_ID]
- Solana Explorer: https://explorer.solana.com/address/[PROGRAM_ID]
- Solana Beach: https://solanabeach.io/address/[PROGRAM_ID]

### Documentation
- API Reference: API_REFERENCE.md
- Deployment Guide: DEPLOYMENT.md
- User Guide: README.md
- Witching Hour: WITCHING_HOUR_ASSAULT.md

## Success Metrics

### Day 1 Targets
- [ ] 100+ unique depositors
- [ ] $10k+ TVL
- [ ] 0 critical bugs
- [ ] 95%+ transaction success rate

### Week 1 Targets
- [ ] 500+ unique depositors
- [ ] $100k+ TVL
- [ ] 10+ Reaper Passes minted
- [ ] Active community engagement

### Month 1 Targets
- [ ] 2000+ unique depositors
- [ ] $500k+ TVL
- [ ] 100+ Reaper Passes minted
- [ ] Partnership announcements

## Notes

- Keep this checklist updated as you progress
- Mark items complete with timestamps
- Document any issues encountered
- Save all transaction signatures
- Backup everything multiple times

---

**Remember**: Mainnet deployment is irreversible. Take your time, double-check everything, and don't rush. The community will appreciate a stable, well-tested product over a rushed launch.

💀 Good luck, and may the yields be ever in your favor! 💀
