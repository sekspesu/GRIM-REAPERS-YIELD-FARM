# Soul Harvest Vault - Quick Start Guide

Get up and running with Soul Harvest Vault in minutes.

## 5-Minute Setup

### 1. Install Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Node dependencies
npm install
```

### 2. Build the Program

```bash
# Build
anchor build

# Run tests
anchor test
```

### 3. Deploy Locally

```bash
# Start local validator (in separate terminal)
solana-test-validator

# Deploy
anchor deploy

# Initialize program
ts-node scripts/initialize.ts
```

## Basic Usage Examples

### Create a Vault

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoulHarvestVault } from "../target/types/soul_harvest_vault";

const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;
const user = anchor.web3.Keypair.generate();

// Derive vault PDA
const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    user.publicKey.toBuffer(),
    tokenMint.toBuffer(),
  ],
  program.programId
);

// Derive leaderboard PDA
const [leaderboardPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("leaderboard"), user.publicKey.toBuffer()],
  program.programId
);

// Create vault with 1000 tokens
await program.methods
  .createVault(new anchor.BN(1000))
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
    tokenMint: tokenMint,
    ownerTokenAccount: userTokenAccount,
    vaultTokenAccount: vaultTokenAccount,
  })
  .signers([user])
  .rpc();

console.log("Vault created!");
```

### Compound Rewards

```typescript
// Wait some time for rewards to accumulate
await sleep(10000); // 10 seconds

// Compound rewards
await program.methods
  .compound()
  .accounts({
    vault: vaultPda,
    config: configPda,
    ownerReaperAccount: null, // or userReaperAccount if they have one
    reaperMint: reaperMint,
  })
  .rpc();

// Fetch updated vault
const vault = await program.account.vault.fetch(vaultPda);
console.log("New balance:", vault.balance.toString());
console.log("Souls harvested:", vault.totalSoulsHarvested.toString());
```

### Withdraw Tokens

```typescript
// Withdraw 500 tokens
await program.methods
  .withdraw(new anchor.BN(500))
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
    vaultTokenAccount: vaultTokenAccount,
    ownerTokenAccount: userTokenAccount,
  })
  .signers([user])
  .rpc();

console.log("Withdrawal successful!");
```

### Close Vault

```typescript
// First, withdraw all remaining tokens
const vault = await program.account.vault.fetch(vaultPda);
if (vault.balance.gt(new anchor.BN(0))) {
  await program.methods
    .withdraw(vault.balance)
    .accounts({
      vault: vaultPda,
      leaderboardEntry: leaderboardPda,
      owner: user.publicKey,
      vaultTokenAccount: vaultTokenAccount,
      ownerTokenAccount: userTokenAccount,
    })
    .signers([user])
    .rpc();
}

// Then close the vault
await program.methods
  .closeVault()
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
  })
  .signers([user])
  .rpc();

console.log("Vault closed, rent reclaimed!");
```

## Common Patterns

### Check if User Has Reaper Pass

```typescript
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

async function hasReaperPass(
  connection: Connection,
  user: PublicKey,
  reaperMint: PublicKey
): Promise<boolean> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(reaperMint, user);
    const account = await getAccount(connection, tokenAccount);
    return account.amount > 0;
  } catch {
    return false;
  }
}

// Usage
const hasPass = await hasReaperPass(connection, user.publicKey, reaperMint);
console.log("User has Reaper Pass:", hasPass);
```

### Calculate Expected Rewards

```typescript
function calculateExpectedRewards(
  balance: number,
  baseApy: number,
  timeElapsedSeconds: number,
  hasReaperPass: boolean,
  reaperBoost: number = 20000
): number {
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
  const BASIS_POINTS = 10000;
  
  // Base rewards
  let rewards = (balance * baseApy * timeElapsedSeconds) / (SECONDS_PER_YEAR * BASIS_POINTS);
  
  // Apply boost if has Reaper Pass
  if (hasReaperPass) {
    rewards = (rewards * reaperBoost) / BASIS_POINTS;
  }
  
  return Math.floor(rewards);
}

// Usage
const balance = 1000;
const baseApy = 1000; // 10%
const oneDay = 24 * 60 * 60;
const hasPass = true;

const expectedRewards = calculateExpectedRewards(balance, baseApy, oneDay, hasPass);
console.log("Expected rewards after 1 day:", expectedRewards);
```

### Fetch Leaderboard

```typescript
async function getLeaderboard(program: Program): Promise<any[]> {
  const entries = await program.account.leaderboardEntry.all();
  
  // Sort by TVL descending
  return entries
    .map(e => ({
      user: e.account.user,
      tvl: e.account.tvl,
      rank: e.account.rank,
    }))
    .sort((a, b) => b.tvl.cmp(a.tvl))
    .map((entry, index) => ({
      ...entry,
      rank: index, // Recalculate rank based on sort
    }));
}

// Usage
const leaderboard = await getLeaderboard(program);
console.log("Top 10 users:");
leaderboard.slice(0, 10).forEach((entry, i) => {
  console.log(`${i + 1}. ${entry.user.toString()}: ${entry.tvl.toString()} tokens`);
});
```

### Fetch All User Vaults

```typescript
async function getUserVaults(
  program: Program,
  user: PublicKey
): Promise<any[]> {
  const vaults = await program.account.vault.all([
    {
      memcmp: {
        offset: 8, // Skip discriminator
        bytes: user.toBase58(),
      },
    },
  ]);
  
  return vaults.map(v => v.account);
}

// Usage
const userVaults = await getUserVaults(program, user.publicKey);
console.log(`User has ${userVaults.length} vault(s)`);
userVaults.forEach(vault => {
  console.log(`- Token: ${vault.tokenMint.toString()}`);
  console.log(`  Balance: ${vault.balance.toString()}`);
  console.log(`  Souls: ${vault.totalSoulsHarvested.toString()}`);
});
```

## Testing

### Run All Tests

```bash
anchor test
```

### Run Specific Test

```bash
anchor test --skip-build -- --grep "create vault"
```

### Test with Logs

```bash
anchor test -- --nocapture
```

## Troubleshooting

### "Insufficient funds" Error

```typescript
// Check user's token balance before creating vault
const tokenAccount = await getAccount(connection, userTokenAccount);
console.log("User balance:", tokenAccount.amount.toString());

// Ensure initial_deposit <= tokenAccount.amount
```

### "Vault is not active" Error

```typescript
// Check vault status
const vault = await program.account.vault.fetch(vaultPda);
console.log("Vault active:", vault.isActive);

// Can't compound inactive vaults, but can still withdraw
if (!vault.isActive) {
  console.log("Vault is closed, can only withdraw");
}
```

### "Invalid deposit amount" Error

```typescript
// Ensure deposit is greater than 0
const initialDeposit = new anchor.BN(1000);
if (initialDeposit.lte(new anchor.BN(0))) {
  throw new Error("Deposit must be greater than 0");
}
```

### Transaction Timeout

```typescript
// Increase confirmation timeout
const tx = await program.methods
  .createVault(new anchor.BN(1000))
  .accounts({ /* ... */ })
  .rpc({ skipPreflight: false, commitment: "confirmed" });

// Wait for confirmation
await connection.confirmTransaction(tx, "confirmed");
```

## Next Steps

- Read the [README.md](README.md) for complete documentation
- Check [API_REFERENCE.md](API_REFERENCE.md) for detailed API docs
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- Review the test suite in `tests/soul-harvest-vault.ts` for more examples

## Common Commands

```bash
# Build program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Check program info
solana program show <PROGRAM_ID>

# Check account
anchor account vault <VAULT_PDA>

# Get program logs
solana logs <PROGRAM_ID>
```

## Useful Links

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [SPL Token Documentation](https://spl.solana.com/token)

## Support

Need help? Check:
- Test suite for working examples
- API reference for detailed documentation
- GitHub issues for known problems
- Solana Discord for community support

Happy building! 🚀
