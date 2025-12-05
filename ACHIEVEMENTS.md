# 🏆 Soul Harvest Achievement System

A gamified achievement and ranking system for the Soul Harvest Vault protocol.

## Overview

The achievement system tracks user progress and rewards engagement with unlockable achievements and rank progression. Users earn points for various activities, which contribute to their rank tier.

## Rank Tiers

Progress through 5 spooky ranks based on total achievement points:

| Rank | Points Required | Bonus APY |
|------|-----------------|-----------|
| 👻 Ghost | 0-99 | None |
| 👤 Specter | 100-299 | +1% |
| 💀 Wraith | 300-599 | +2.5% |
| 👑 Phantom | 600-999 | +5% |
| ⚔️ Reaper | 1000+ | +10% |

## Achievements (27 Total)

### 💰 Deposit Achievements
| Achievement | Requirement | Points |
|-------------|-------------|--------|
| 🩸 First Blood | Make your first deposit | 10 |
| 👻 Soul Starter | Deposit 1,000 tokens | 20 |
| ⚰️ Grave Digger | Deposit 10,000 tokens | 40 |
| 🪦 Crypt Keeper | Deposit 100,000 tokens | 70 |
| 💀 Necromancer | Deposit 1,000,000 tokens | 100 |

### 👤 Soul Harvesting Achievements
| Achievement | Requirement | Points |
|-------------|-------------|--------|
| 👤 Soul Collector | Harvest 100 souls | 15 |
| ⚔️ Soul Reaper | Harvest 1,000 souls | 30 |
| 🎭 Soul Master | Harvest 10,000 souls | 60 |
| 👑 Death Lord | Harvest 100,000 souls | 100 |
| 💀 Grim Reaper | Harvest 1,000,000 souls | 150 |

### ⚡ Compound Achievements
| Achievement | Requirement | Points |
|-------------|-------------|--------|
| 🦉 Night Owl | Compound at midnight (00:00-01:00 UTC) | 25 |
| 🐦 Early Bird | Compound at dawn (05:00-06:00 UTC) | 25 |
| 👑 Compound King | Perform 10 compounds | 20 |
| 🌾 Yield Farmer | Perform 100 compounds | 35 |
| 🎰 DeFi Degen | Perform 1,000 compounds | 50 |

### 🌙 Midnight Harvest Achievements
| Achievement | Requirement | Points |
|-------------|-------------|--------|
| 🌙 Witching Hour | Participate in 1 midnight harvest | 20 |
| 👻 Haunted | Participate in 7 midnight harvests | 40 |
| 😈 Possessed | Participate in 30 midnight harvests | 80 |
| ♾️ Eternal | Participate in 365 midnight harvests | 200 |

### ⭐ Special Achievements
| Achievement | Requirement | Points |
|-------------|-------------|--------|
| 🎭 Reaper's Chosen | Hold a Reaper Pass NFT | 100 |
| 💎 Diamond Hands | Hold for 30 days without withdrawing | 75 |
| 🏛️ OG Soul | Among first 100 depositors | 100 |
| 🐋 Whale | Have 1M+ tokens in vault | 80 |
| 💝 Charity Champion | Donate 10,000+ via midnight harvest | 60 |

### 🔥 Streak Achievements
| Achievement | Requirement | Points |
|-------------|-------------|--------|
| 🔥 Hot Streak | Compound 7 days in a row | 30 |
| 🔥🔥 On Fire | Compound 30 days in a row | 60 |
| 💥 Unstoppable | Compound 100 days in a row | 100 |

## Instructions

### Initialize Achievement Tracking

```typescript
// Derive achievements PDA
const [achievementsPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("achievements"), user.publicKey.toBuffer()],
  program.programId
);

// Initialize achievements for user
await program.methods
  .initAchievements()
  .accounts({
    achievements: achievementsPda,
    user: user.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Check & Unlock Achievements

```typescript
// Check achievements based on current vault state
const result = await program.methods
  .checkAchievements()
  .accounts({
    achievements: achievementsPda,
    vault: vaultPda,
    config: configPda,
    user: user.publicKey,
  })
  .rpc();

// Result contains:
// - newlyUnlocked: string[] - Names of newly unlocked achievements
// - pointsEarned: number - Points earned this check
// - newRank: string - Current rank name
// - totalPoints: number - Total achievement points
```

### Fetch Achievement Data

```typescript
const achievements = await program.account.userAchievements.fetch(achievementsPda);

console.log("User:", achievements.user.toString());
console.log("Unlocked (bitfield):", achievements.unlocked.toString(2));
console.log("Rank:", achievements.rank);
console.log("Points:", achievements.points);
console.log("Total Compounds:", achievements.totalCompounds);
console.log("Midnight Harvests:", achievements.midnightHarvestCount);
```

## Account Structure

### UserAchievements PDA
- **Seeds**: `["achievements", user]`
- **Size**: 78 bytes

```rust
pub struct UserAchievements {
    pub user: Pubkey,              // 32 bytes
    pub unlocked: u64,             // 8 bytes (bitfield for 64 achievements)
    pub rank: u8,                  // 1 byte
    pub points: u32,               // 4 bytes
    pub first_deposit_time: i64,   // 8 bytes
    pub midnight_harvest_count: u32, // 4 bytes
    pub highest_compound: u64,     // 8 bytes
    pub total_compounds: u32,      // 4 bytes
    pub bump: u8,                  // 1 byte
}
```

## Integration Tips

1. **Call `initAchievements` once** when a user first interacts with the protocol
2. **Call `checkAchievements` after key actions** like deposits, compounds, and withdrawals
3. **Display rank badges** in your UI based on the user's rank tier
4. **Show progress** towards next achievements to encourage engagement
5. **Celebrate unlocks** with notifications or animations

## Future Enhancements

- [ ] Achievement NFT badges
- [ ] Seasonal limited-time achievements
- [ ] Leaderboard integration
- [ ] Social sharing of achievements
- [ ] Achievement-gated features

---

**The more you harvest, the more you achieve! 🎃💀**
