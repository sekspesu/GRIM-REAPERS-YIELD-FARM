# Dynamic APY System - Fear Index

The Soul Harvest Vault now features a dynamic APY system based on the total value locked (TVL) across all vaults. The more souls locked in the protocol, the scarier (higher) the yield becomes! 💀

## APY Tiers

The APY automatically adjusts based on the global TVL:

| TVL Range | APY | Description |
|-----------|-----|-------------|
| ≥ 100,000 SOL | **15.0%** | Maximum fear! The souls are overflowing 💀💀💀 |
| ≥ 50,000 SOL | **12.0%** | High fear - souls are gathering 💀💀 |
| ≥ 10,000 SOL | **8.0%** | Moderate fear - souls are accumulating 💀 |
| < 10,000 SOL | **5.0%** | Base fear - just getting started 👻 |

## How It Works

### 1. Global TVL Tracking

The `VaultConfig` account now tracks `total_tvl` - the sum of all tokens locked across all vaults in the protocol.

```rust
pub struct VaultConfig {
    // ... other fields
    pub total_tvl: u64,  // Total value locked across all vaults
}
```

### 2. Dynamic APY Calculation

When compounding rewards, the system calculates the current APY based on TVL:

```rust
pub fn calculate_dynamic_apy(&self) -> u16 {
    const SOL_LAMPORTS: u64 = 1_000_000_000; // 1 SOL = 1 billion lamports
    
    let tvl_in_sol = self.total_tvl / SOL_LAMPORTS;
    
    if tvl_in_sol >= 100_000 {
        1500 // 15.0% APY
    } else if tvl_in_sol >= 50_000 {
        1200 // 12.0% APY
    } else if tvl_in_sol >= 10_000 {
        800 // 8.0% APY
    } else {
        500 // 5.0% APY
    }
}
```

### 3. TVL Updates

The global TVL is automatically updated when:

- **Creating a vault**: TVL increases by the initial deposit
- **Withdrawing**: TVL decreases by the withdrawal amount
- **Compounding**: TVL increases by the rewards earned
- **Midnight Harvest**: TVL increases by the net rewards (after tax and charity)

### 4. Real-time APY Display

When compounding or harvesting, the current APY is displayed:

```
Current APY: 12.0% – The more souls, the scarier the yield 💀
```

## Example Scenarios

### Scenario 1: Early Protocol (< 10,000 SOL TVL)
- User deposits 1,000 SOL
- Current APY: **5.0%**
- Annual rewards: 50 SOL
- With Reaper Pass (2x boost): 100 SOL

### Scenario 2: Growing Protocol (50,000 SOL TVL)
- User deposits 1,000 SOL
- Current APY: **12.0%**
- Annual rewards: 120 SOL
- With Reaper Pass (2x boost): 240 SOL

### Scenario 3: Mature Protocol (100,000+ SOL TVL)
- User deposits 1,000 SOL
- Current APY: **15.0%**
- Annual rewards: 150 SOL
- With Reaper Pass (2x boost): 300 SOL

## Benefits

1. **Incentivizes Growth**: Higher TVL = Higher APY for everyone
2. **Network Effects**: Early users benefit as more users join
3. **Transparent**: APY is calculated on-chain based on verifiable TVL
4. **Fair**: Everyone gets the same APY tier based on global TVL
5. **Gamified**: Creates excitement as the protocol grows

## Technical Details

### APY in Basis Points

APY is stored and calculated in basis points (1 bp = 0.01%):
- 500 bps = 5.0%
- 800 bps = 8.0%
- 1200 bps = 12.0%
- 1500 bps = 15.0%

### Reward Calculation Formula

```
base_rewards = (balance * dynamic_apy * time_elapsed) / (365 days * 10000)

if has_reaper_pass:
    final_rewards = base_rewards * 2.0
else:
    final_rewards = base_rewards
```

### TVL Precision

TVL is tracked in lamports (smallest unit):
- 1 SOL = 1,000,000,000 lamports
- Supports fractional SOL amounts
- No precision loss in calculations

## Client Integration

### Fetching Current APY

```typescript
// Fetch config account
const config = await program.account.vaultConfig.fetch(configPda);

// Calculate current APY
const SOL_LAMPORTS = 1_000_000_000;
const tvlInSol = config.totalTvl.toNumber() / SOL_LAMPORTS;

let currentApy;
if (tvlInSol >= 100_000) {
    currentApy = 15.0;
} else if (tvlInSol >= 50_000) {
    currentApy = 12.0;
} else if (tvlInSol >= 10_000) {
    currentApy = 8.0;
} else {
    currentApy = 5.0;
}

console.log(`Current APY: ${currentApy}%`);
console.log(`Total TVL: ${tvlInSol.toLocaleString()} SOL`);
```

### Displaying APY in UI

```typescript
// Example React component
function ApyDisplay() {
    const { config } = useVaultConfig();
    const apy = calculateDynamicApy(config.totalTvl);
    const tvlInSol = config.totalTvl / 1_000_000_000;
    
    return (
        <div className="apy-display">
            <h2>Current APY: {apy}%</h2>
            <p>The more souls, the scarier the yield 💀</p>
            <p>Total TVL: {tvlInSol.toLocaleString()} SOL</p>
        </div>
    );
}
```

## Migration Notes

If you have an existing deployment, you'll need to:

1. **Upgrade the program** with the new `VaultConfig` structure
2. **Initialize `total_tvl`** by summing all existing vault balances
3. **Update client code** to pass the `config` account to compound/withdraw instructions

## Security Considerations

- TVL updates use checked arithmetic to prevent overflow
- TVL is only modified by authorized instructions
- APY calculation is deterministic and verifiable on-chain
- No external oracles or price feeds required

## Future Enhancements

Potential improvements to the dynamic APY system:

1. **More granular tiers**: Add additional TVL thresholds
2. **Time-based multipliers**: Bonus APY during special events
3. **Token-specific APY**: Different rates for different token types
4. **Governance**: Let token holders vote on APY tiers
5. **APY history**: Track historical APY changes on-chain

---

**The more souls you harvest, the greater the rewards! 💀🎃**
