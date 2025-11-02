# Soul Harvest Vault - API Reference

Complete API reference for client integration with the Soul Harvest Vault program.

## Table of Contents

- [Program ID](#program-id)
- [Account Types](#account-types)
- [Instructions](#instructions)
- [PDA Derivation](#pda-derivation)
- [Events](#events)
- [Error Codes](#error-codes)
- [Constants](#constants)

## Program ID

```
Devnet: TBD (deploy and update)
Mainnet: TBD (deploy and update)
```

## Account Types

### VaultConfig

Global configuration account for the program.

**PDA Seeds**: `["config"]`

**Size**: 87 bytes

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| authority | Pubkey | Program authority that can mint Reaper Passes |
| reaper_mint | Pubkey | Mint address for Reaper Pass NFTs |
| reaper_supply | u16 | Current number of Reaper Passes minted (max 1666) |
| base_apy | u16 | Base APY in basis points (e.g., 1000 = 10%) - **Note: Dynamic APY is now calculated based on total_tvl** |
| reaper_boost | u16 | Boost multiplier for Reaper Pass holders in basis points (e.g., 20000 = 2.0x) |
| souls_per_token | u64 | Number of souls earned per token compounded |
| total_tvl | u64 | Total value locked across all vaults (used for dynamic APY calculation) |
| bump | u8 | PDA bump seed |

**TypeScript Interface**:
```typescript
interface VaultConfig {
  authority: PublicKey;
  reaperMint: PublicKey;
  reaperSupply: number;
  baseApy: number;
  reaperBoost: number;
  soulsPerToken: BN;
  totalTvl: BN;
  bump: number;
}
```

**Dynamic APY (Fear Index)**:

The program now features a dynamic APY system that adjusts based on `total_tvl`:

| TVL Range | APY | Description |
|-----------|-----|-------------|
| ≥ 100,000 SOL | 15.0% | Maximum fear! 💀💀💀 |
| ≥ 50,000 SOL | 12.0% | High fear 💀💀 |
| ≥ 10,000 SOL | 8.0% | Moderate fear 💀 |
| < 10,000 SOL | 5.0% | Base fear 👻 |

See [DYNAMIC_APY.md](./DYNAMIC_APY.md) for complete details.

### Vault

Individual user vault for token staking.

**PDA Seeds**: `["vault", owner, token_mint]`

**Size**: 98 bytes

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| owner | Pubkey | Owner of the vault |
| token_mint | Pubkey | Token mint being staked in this vault |
| balance | u64 | Current token balance in the vault |
| last_compound | i64 | Timestamp of last compound operation (Unix timestamp) |
| total_souls_harvested | u64 | Cumulative souls harvested by this vault |
| is_active | bool | Whether the vault is active (false when closed) |
| bump | u8 | PDA bump seed |

**TypeScript Interface**:
```typescript
interface Vault {
  owner: PublicKey;
  tokenMint: PublicKey;
  balance: BN;
  lastCompound: BN;
  totalSoulsHarvested: BN;
  isActive: boolean;
  bump: number;
}
```

### LeaderboardEntry

Leaderboard entry tracking user's TVL and rank.

**PDA Seeds**: `["leaderboard", user]`

**Size**: 53 bytes

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| user | Pubkey | User's public key |
| tvl | u64 | Total value locked across all user's vaults |
| rank | u32 | Current rank on the leaderboard (0-indexed, 0 = highest) |
| bump | u8 | PDA bump seed |

**TypeScript Interface**:
```typescript
interface LeaderboardEntry {
  user: PublicKey;
  tvl: BN;
  rank: number;
  bump: number;
}
```

## Instructions

### initialize

Initialize the Soul Harvest Vault program.

**Parameters**:
- `base_apy: u16` - Base APY in basis points
- `souls_per_token: u64` - Souls earned per token compounded

**Accounts**:

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| config | ✓ | | VaultConfig PDA (initialized) |
| reaper_mint | ✓ | | Reaper Pass mint (initialized) |
| authority | ✓ | ✓ | Program authority (payer) |
| system_program | | | System program |
| token_program | | | SPL Token program |
| rent | | | Rent sysvar |

**TypeScript Example**:
```typescript
const tx = await program.methods
  .initialize(1000, new BN(1))
  .accounts({
    config: configPda,
    reaperMint: reaperMintKeypair.publicKey,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([authority, reaperMintKeypair])
  .rpc();
```

### create_vault

Create a new vault with an initial deposit.

**Parameters**:
- `initial_deposit: u64` - Amount of tokens to deposit (must be > 0)

**Accounts**:

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| vault | ✓ | | Vault PDA (initialized) |
| leaderboard_entry | ✓ | | LeaderboardEntry PDA (initialized) |
| owner | ✓ | ✓ | Vault owner (payer) |
| token_mint | | | Token being staked |
| owner_token_account | ✓ | | Owner's token account (source) |
| vault_token_account | ✓ | | Vault's token account (initialized) |
| token_program | | | SPL Token program |
| system_program | | | System program |
| rent | | | Rent sysvar |

**TypeScript Example**:
```typescript
const tx = await program.methods
  .createVault(new BN(1000))
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
    tokenMint: tokenMint,
    ownerTokenAccount: userTokenAccount,
    vaultTokenAccount: vaultTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([user])
  .rpc();
```

### compound

Compound rewards for a vault.

**Parameters**: None

**Accounts**:

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| vault | ✓ | | Vault PDA |
| config | | | VaultConfig PDA |
| owner_reaper_account | | | Owner's Reaper Pass token account (optional) |
| reaper_mint | | | Reaper Pass mint |
| clock | | | Clock sysvar |

**TypeScript Example**:
```typescript
const tx = await program.methods
  .compound()
  .accounts({
    vault: vaultPda,
    config: configPda,
    ownerReaperAccount: userReaperAccount, // or null
    reaperMint: reaperMint,
    clock: SYSVAR_CLOCK_PUBKEY,
  })
  .rpc();
```

**Reward Calculation**:
```
time_elapsed = current_time - last_compound (seconds)
base_rewards = (balance * base_apy * time_elapsed) / (365 * 24 * 60 * 60 * 10000)

if owner_reaper_account.amount > 0:
    final_rewards = base_rewards * (reaper_boost / 10000)
else:
    final_rewards = base_rewards

souls_earned = final_rewards * souls_per_token

vault.balance += final_rewards
vault.total_souls_harvested += souls_earned
vault.last_compound = current_time
```

### withdraw

Withdraw tokens from a vault.

**Parameters**:
- `amount: u64` - Amount of tokens to withdraw

**Accounts**:

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| vault | ✓ | | Vault PDA |
| leaderboard_entry | ✓ | | LeaderboardEntry PDA |
| owner | | ✓ | Vault owner |
| vault_token_account | ✓ | | Vault's token account (source) |
| owner_token_account | ✓ | | Owner's token account (destination) |
| token_program | | | SPL Token program |

**TypeScript Example**:
```typescript
const tx = await program.methods
  .withdraw(new BN(500))
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
    vaultTokenAccount: vaultTokenAccount,
    ownerTokenAccount: userTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([user])
  .rpc();
```

### close_vault

Close a vault and reclaim rent.

**Parameters**: None

**Accounts**:

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| vault | ✓ | | Vault PDA (closed) |
| leaderboard_entry | ✓ | | LeaderboardEntry PDA (closed) |
| owner | ✓ | ✓ | Vault owner (receives rent) |

**TypeScript Example**:
```typescript
const tx = await program.methods
  .closeVault()
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
  })
  .signers([user])
  .rpc();
```

### mint_reaper_pass

Mint a Reaper Pass NFT (authority only).

**Parameters**: None

**Accounts**:

| Account | Writable | Signer | Description |
|---------|----------|--------|-------------|
| config | ✓ | | VaultConfig PDA |
| reaper_mint | ✓ | | Reaper Pass mint |
| recipient_token_account | ✓ | | Recipient's token account (initialized if needed) |
| recipient | | | Recipient public key |
| authority | ✓ | ✓ | Program authority (payer) |
| metadata | ✓ | | Metaplex metadata account (initialized) |
| master_edition | ✓ | | Metaplex master edition account (initialized) |
| token_program | | | SPL Token program |
| associated_token_program | | | Associated Token program |
| token_metadata_program | | | Metaplex Token Metadata program |
| system_program | | | System program |
| rent | | | Rent sysvar |

**TypeScript Example**:
```typescript
const [metadata] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    METADATA_PROGRAM_ID.toBuffer(),
    reaperMint.toBuffer(),
  ],
  METADATA_PROGRAM_ID
);

const [masterEdition] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    METADATA_PROGRAM_ID.toBuffer(),
    reaperMint.toBuffer(),
    Buffer.from("edition"),
  ],
  METADATA_PROGRAM_ID
);

const tx = await program.methods
  .mintReaperPass()
  .accounts({
    config: configPda,
    reaperMint: reaperMint,
    recipientTokenAccount: recipientTokenAccount,
    recipient: recipient.publicKey,
    authority: authority.publicKey,
    metadata: metadata,
    masterEdition: masterEdition,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    tokenMetadataProgram: METADATA_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([authority])
  .rpc();
```

## PDA Derivation

### Config PDA

```typescript
const [configPda, configBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  programId
);
```

### Vault PDA

```typescript
const [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    owner.toBuffer(),
    tokenMint.toBuffer(),
  ],
  programId
);
```

### Leaderboard Entry PDA

```typescript
const [leaderboardPda, leaderboardBump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("leaderboard"),
    user.toBuffer(),
  ],
  programId
);
```

### Metaplex Metadata PDA

```typescript
const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const [metadata] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ],
  METADATA_PROGRAM_ID
);
```

### Metaplex Master Edition PDA

```typescript
const [masterEdition] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
    Buffer.from("edition"),
  ],
  METADATA_PROGRAM_ID
);
```

## Events

The program emits log messages for all state changes. Parse transaction logs to track events.

### VaultCreated

```
msg!("Vault created successfully");
msg!("Owner: {}", vault.owner);
msg!("Token Mint: {}", vault.token_mint);
msg!("Initial Balance: {}", vault.balance);
msg!("Leaderboard TVL: {}", leaderboard_entry.tvl);
```

### CompoundExecuted

```
msg!("Compound executed successfully");
msg!("Time elapsed: {} seconds", time_elapsed);
msg!("Rewards compounded: {}", rewards);
msg!("Souls harvested: {}", souls_earned);
msg!("New balance: {}", vault.balance);
msg!("Total souls: {}", vault.total_souls_harvested);
```

### WithdrawalExecuted

```
msg!("Withdrawal successful");
msg!("Amount: {}", amount);
msg!("New vault balance: {}", vault.balance);
msg!("New leaderboard TVL: {}", leaderboard_entry.tvl);
```

### VaultClosed

```
msg!("Vault closed successfully");
msg!("Owner: {}", vault.owner);
msg!("Token mint: {}", vault.token_mint);
msg!("Total souls harvested: {}", vault.total_souls_harvested);
```

### ReaperPassMinted

```
msg!("Reaper Pass minted successfully");
msg!("Recipient: {}", recipient.key());
msg!("Current supply: {}/{}", config.reaper_supply, REAPER_MAX_SUPPLY);
```

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | InsufficientFunds | Insufficient funds for operation |
| 6001 | InsufficientBalance | Insufficient balance in vault |
| 6002 | NonZeroBalance | Vault balance must be zero to close |
| 6003 | VaultInactive | Vault is not active |
| 6004 | SupplyExhausted | Reaper Pass supply exhausted |
| 6005 | Unauthorized | Unauthorized: only authority can perform this action |
| 6006 | InvalidMint | Invalid token mint |
| 6007 | ArithmeticOverflow | Arithmetic overflow |
| 6008 | InvalidDepositAmount | Invalid deposit amount |

**TypeScript Error Handling**:
```typescript
try {
  await program.methods.createVault(new BN(0)).rpc();
} catch (error) {
  if (error.code === 6008) {
    console.error("Invalid deposit amount");
  }
}
```

## Constants

### Program Constants

```typescript
// Maximum Reaper Pass supply
const REAPER_MAX_SUPPLY = 1666;

// Time constants (seconds)
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_YEAR = 31536000;

// Calculation constants
const BASIS_POINTS_DIVISOR = 10000;

// Default values
const DEFAULT_BASE_APY = 1000; // 10%
const DEFAULT_REAPER_BOOST = 20000; // 2.0x
const DEFAULT_SOULS_PER_TOKEN = 1;

// Metaplex metadata
const REAPER_PASS_NAME = "Kiroween Reaper Pass";
const REAPER_PASS_SYMBOL = "REAPER";
const REAPER_PASS_URI = "https://arweave.net/halloween-reaper.json";
```

## Helper Functions

### Fetch All Vaults for User

```typescript
async function getUserVaults(
  program: Program,
  user: PublicKey
): Promise<Vault[]> {
  const vaults = await program.account.vault.all([
    {
      memcmp: {
        offset: 8, // Discriminator
        bytes: user.toBase58(),
      },
    },
  ]);
  return vaults.map(v => v.account);
}
```

### Fetch Leaderboard

```typescript
async function getLeaderboard(
  program: Program
): Promise<LeaderboardEntry[]> {
  const entries = await program.account.leaderboardEntry.all();
  return entries
    .map(e => e.account)
    .sort((a, b) => b.tvl.cmp(a.tvl));
}
```

### Calculate Expected Rewards

```typescript
function calculateRewards(
  balance: BN,
  baseApy: number,
  timeElapsed: number,
  hasReaperPass: boolean,
  reaperBoost: number
): BN {
  const SECONDS_PER_YEAR = 31536000;
  const BASIS_POINTS = 10000;
  
  // base_rewards = (balance * base_apy * time_elapsed) / (365 days * 10000)
  let rewards = balance
    .mul(new BN(baseApy))
    .mul(new BN(timeElapsed))
    .div(new BN(SECONDS_PER_YEAR * BASIS_POINTS));
  
  // Apply boost if has Reaper Pass
  if (hasReaperPass) {
    rewards = rewards.mul(new BN(reaperBoost)).div(new BN(BASIS_POINTS));
  }
  
  return rewards;
}
```

### Check Reaper Pass Ownership

```typescript
async function hasReaperPass(
  connection: Connection,
  user: PublicKey,
  reaperMint: PublicKey
): Promise<boolean> {
  const tokenAccount = await getAssociatedTokenAddress(
    reaperMint,
    user
  );
  
  try {
    const account = await getAccount(connection, tokenAccount);
    return account.amount > 0;
  } catch {
    return false;
  }
}
```

## Rate Limits and Best Practices

### Compound Frequency

- No minimum time between compounds
- Consider adding client-side cooldown to reduce transaction costs
- Recommended: compound once per day for optimal gas efficiency

### Leaderboard Updates

- Leaderboard TVL updates automatically on deposits/withdrawals
- Ranks can be calculated off-chain by sorting entries by TVL
- For large-scale applications, consider using an indexer (e.g., The Graph)

### Transaction Optimization

- Batch multiple operations when possible
- Use versioned transactions for lower fees
- Consider priority fees during high network congestion

### Error Handling

- Always handle errors gracefully
- Retry failed transactions with exponential backoff
- Validate inputs client-side before submitting transactions

## Support

For questions or issues with the API, please:
- Open an issue on GitHub
- Check the test suite for usage examples
- Review the program source code for implementation details
