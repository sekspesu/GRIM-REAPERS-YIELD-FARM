# Midnight Harvest - Automated Daily Compounding

## Overview

The Midnight Harvest is an automated daily operation that compounds rewards for all active vaults with special mechanics:

- **13% Soul Tax**: Deducted from rewards (tracked for burning)
- **1% Charity**: Sent to Solana Foundation
- **86% Net Reward**: Added to vault balance
- **Soul Harvesting**: Accumulates souls based on total rewards

## How It Works

### On-Chain Instruction

The `midnight_harvest` instruction performs the following:

1. Calculates rewards based on time elapsed since last compound
2. Applies Reaper Pass boost (2x) if owner holds the NFT
3. Deducts 13% soul tax from rewards
4. Deducts 1% charity donation
5. Adds remaining 86% to vault balance
6. Transfers charity amount to Solana Foundation
7. Updates soul harvest totals
8. Emits `MidnightHarvestEvent` with all details

### Reward Formula

```
base_rewards = (balance * base_apy * time_elapsed) / (365 days * 10000)

if has_reaper_pass:
    total_rewards = base_rewards * 2.0
else:
    total_rewards = base_rewards

soul_tax = total_rewards * 0.13
charity = total_rewards * 0.01
net_reward = total_rewards - soul_tax - charity

vault.balance += net_reward
vault.total_souls_harvested += (total_rewards * souls_per_token)
```

## Setup Options

### Option 1: Manual Execution via Kiro Hook

The easiest way to test and run midnight harvest:

1. Open the Kiro Agent Hooks panel in your IDE
2. Find the "🌙 Midnight Reaper" hook
3. Click the button to execute manually

### Option 2: Automated Cron Job (Linux/Mac)

Set up a cron job to run automatically at midnight UTC:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 00:00 UTC)
0 0 * * * cd /path/to/soul-harvest-vault && ts-node scripts/midnight-harvest.ts >> logs/midnight-harvest.log 2>&1
```

### Option 3: Automated Task Scheduler (Windows)

1. Open Task Scheduler
2. Create a new task:
   - **Trigger**: Daily at 00:00 UTC
   - **Action**: Start a program
   - **Program**: `cmd.exe`
   - **Arguments**: `/c cd C:\path\to\soul-harvest-vault && ts-node scripts\midnight-harvest.ts >> logs\midnight-harvest.log 2>&1`

### Option 4: Cloud Scheduler (Production)

For production deployments, use a cloud-based scheduler:

#### AWS EventBridge + Lambda

```typescript
// Lambda function
export const handler = async (event: any) => {
  // Execute midnight harvest script
  const result = await executeMidnightHarvest();
  return result;
};

// EventBridge rule: cron(0 0 * * ? *)
```

#### Google Cloud Scheduler

```bash
gcloud scheduler jobs create http midnight-harvest \
  --schedule="0 0 * * *" \
  --uri="https://your-api.com/midnight-harvest" \
  --http-method=POST \
  --time-zone="UTC"
```

#### Clockwork (Solana Native)

For fully on-chain automation, integrate with [Clockwork](https://www.clockwork.xyz/):

```rust
// Create a Clockwork thread that triggers midnight_harvest
// at midnight UTC daily for each vault
```

## Environment Setup

Before running the script, ensure these environment variables are set:

```bash
# .env file
ANCHOR_WALLET=/path/to/wallet.json
ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com
CHARITY_WALLET=SoLFdqjXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Running Manually

```bash
# Install dependencies
npm install

# Run midnight harvest
npm run midnight-harvest

# Or directly with ts-node
ts-node scripts/midnight-harvest.ts
```

## Monitoring

The script outputs detailed logs:

```
🌙 Starting Midnight Harvest...
   Time: 2025-11-02T00:00:00.000Z
   Program: 11111111111111111111111111111111

📊 Found 42 active vaults

✅ Harvested vault ABC123...
   Owner: XYZ789...
   Signature: 5KJH...

🎃 Midnight Harvest Complete!
   ✅ Success: 40
   ❌ Failed: 2
   📈 Total: 42
```

## Event Monitoring

Listen for `MidnightHarvestEvent` to track harvests:

```typescript
program.addEventListener("MidnightHarvestEvent", (event, slot) => {
  console.log(`Vault ${event.vault} harvested:`);
  console.log(`  Rewards: ${event.rewards}`);
  console.log(`  Soul Tax: ${event.soulTax}`);
  console.log(`  Charity: ${event.charityAmount}`);
  console.log(`  Net Reward: ${event.netReward}`);
  console.log(`  Souls: ${event.soulsEarned}`);
});
```

## Security Considerations

1. **Wallet Security**: The wallet running the script needs SOL for transaction fees but does NOT need to be the vault owner
2. **Rate Limiting**: The script includes delays to avoid RPC rate limits
3. **Error Handling**: Failed harvests are logged but don't stop the batch process
4. **Charity Wallet**: Verify the Solana Foundation wallet address before deployment

## Troubleshooting

### "Insufficient funds" error
- Ensure the wallet has enough SOL for transaction fees
- Each harvest costs ~0.000005 SOL

### "Vault inactive" error
- The vault has been closed or deactivated
- This is expected and can be ignored

### RPC rate limiting
- Increase the delay between harvests in the script
- Use a dedicated RPC endpoint with higher limits

### Charity transfer fails
- Ensure the charity token account exists for each token mint
- May need to create associated token accounts first

## Cost Estimation

For 1000 active vaults:
- Transaction fees: ~0.005 SOL (~$0.50 at $100/SOL)
- RPC calls: ~2000 requests
- Execution time: ~2-3 minutes

## Future Enhancements

- [ ] Implement actual token burning for soul tax
- [ ] Add Clockwork integration for fully on-chain automation
- [ ] Create dashboard for monitoring harvest history
- [ ] Add notifications for failed harvests
- [ ] Implement batch transactions for efficiency
- [ ] Add support for multiple charity recipients
