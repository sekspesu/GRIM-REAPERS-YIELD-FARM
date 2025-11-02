# Soul Harvest Vault

A Solana-based DeFi protocol built with Anchor that enables users to deposit tokens into vaults that automatically compound rewards over time. The system features gamified "soul harvesting" mechanics, Reaper Pass NFT boosts, and an on-chain leaderboard.

## Features

- **Token Vaults**: Create vaults to stake tokens and earn time-based compounding rewards
- **Dynamic APY (Fear Index)**: APY automatically increases from 5% to 15% based on total protocol TVL - the more souls, the scarier the yield! 💀
- **Soul Harvesting**: Accumulate souls based on vault activity and compounded rewards
- **Reaper Pass NFTs**: Limited-edition NFTs (1666 supply) that provide 2x reward boost
- **Midnight Harvest**: Automated daily compounding with 13% soul tax and 1% charity donation
- **Leaderboard System**: Track and rank users by Total Value Locked (TVL)
- **Flexible Withdrawals**: Withdraw tokens at any time, even from inactive vaults
- **Rent Reclamation**: Close empty vaults to reclaim rent

## Architecture

### Program Structure

```
soul-harvest-vault/
├── programs/
│   └── soul-harvest-vault/
│       └── src/
│           ├── lib.rs              # Program entry point
│           ├── state/              # Account structures
│           │   ├── config.rs       # Global configuration
│           │   ├── vault.rs        # User vault
│           │   └── leaderboard.rs  # Leaderboard entry
│           ├── instructions/       # Instruction handlers
│           │   ├── initialize.rs
│           │   ├── create_vault.rs
│           │   ├── compound.rs
│           │   ├── withdraw.rs
│           │   ├── close_vault.rs
│           │   └── mint_reaper_pass.rs
│           ├── errors.rs           # Custom errors
│           └── constants.rs        # Program constants
└── tests/
    └── soul-harvest-vault.ts       # Integration tests
```

### Account Structure

#### VaultConfig (Global Configuration)
- **PDA Seeds**: `["config"]`
- **Fields**:
  - `authority`: Program authority (can mint Reaper Passes)
  - `reaper_mint`: Reaper Pass NFT mint address
  - `reaper_supply`: Current minted supply (max 1666)
  - `base_apy`: Base APY in basis points (e.g., 1000 = 10%)
  - `reaper_boost`: Boost multiplier in basis points (e.g., 20000 = 2.0x)
  - `souls_per_token`: Souls earned per token compounded

#### Vault (User Vault)
- **PDA Seeds**: `["vault", owner, token_mint]`
- **Fields**:
  - `owner`: Vault owner's public key
  - `token_mint`: Token being staked
  - `balance`: Current token balance
  - `last_compound`: Last compound timestamp
  - `total_souls_harvested`: Cumulative souls earned
  - `is_active`: Vault status

#### LeaderboardEntry (User Ranking)
- **PDA Seeds**: `["leaderboard", user]`
- **Fields**:
  - `user`: User's public key
  - `tvl`: Total value locked
  - `rank`: Current rank (0-indexed)

## Instructions

### 1. Initialize

Initialize the program configuration and create the Reaper Pass mint.

**Parameters**:
- `base_apy: u16` - Base APY in basis points
- `souls_per_token: u64` - Souls earned per token

**Accounts**:
- `config` (init) - VaultConfig PDA
- `reaper_mint` (init) - Reaper Pass mint
- `authority` (signer) - Program authority

**Example**:
```typescript
await program.methods
  .initialize(1000, 1) // 10% APY, 1 soul per token
  .accounts({
    config: configPda,
    reaperMint: reaperMintKeypair.publicKey,
    authority: authority.publicKey,
  })
  .signers([authority, reaperMintKeypair])
  .rpc();
```

### 2. Create Vault

Create a new vault with an initial deposit.

**Parameters**:
- `initial_deposit: u64` - Amount of tokens to deposit (must be > 0)

**Accounts**:
- `vault` (init) - Vault PDA
- `leaderboard_entry` (init) - LeaderboardEntry PDA
- `owner` (signer) - Vault owner
- `token_mint` - Token being staked
- `owner_token_account` - Owner's token account
- `vault_token_account` (init) - Vault's token account

**Example**:
```typescript
await program.methods
  .createVault(new BN(1000))
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
```

### 3. Compound

Compound rewards for a vault based on time elapsed.

**Accounts**:
- `vault` (mut) - Vault PDA
- `config` - VaultConfig PDA
- `owner_reaper_account` (optional) - Owner's Reaper Pass token account
- `reaper_mint` - Reaper Pass mint

**Reward Formula**:
```
time_elapsed = current_time - last_compound
base_rewards = (balance * base_apy * time_elapsed) / (365 days * 10000)

if has_reaper_pass:
    final_rewards = base_rewards * (reaper_boost / 10000)
else:
    final_rewards = base_rewards

souls_earned = final_rewards * souls_per_token
```

**Example**:
```typescript
await program.methods
  .compound()
  .accounts({
    vault: vaultPda,
    config: configPda,
    ownerReaperAccount: userReaperAccount, // Optional
    reaperMint: reaperMint,
  })
  .rpc();
```

### 4. Withdraw

Withdraw tokens from a vault.

**Parameters**:
- `amount: u64` - Amount of tokens to withdraw

**Accounts**:
- `vault` (mut) - Vault PDA
- `leaderboard_entry` (mut) - LeaderboardEntry PDA
- `owner` (signer) - Vault owner
- `vault_token_account` - Vault's token account
- `owner_token_account` - Owner's token account

**Example**:
```typescript
await program.methods
  .withdraw(new BN(500))
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
    vaultTokenAccount: vaultTokenAccount,
    ownerTokenAccount: userTokenAccount,
  })
  .signers([user])
  .rpc();
```

### 5. Close Vault

Close a vault and reclaim rent (vault balance must be zero).

**Accounts**:
- `vault` (mut, close) - Vault PDA
- `leaderboard_entry` (mut, close) - LeaderboardEntry PDA
- `owner` (signer) - Vault owner

**Example**:
```typescript
await program.methods
  .closeVault()
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: user.publicKey,
  })
  .signers([user])
  .rpc();
```

### 6. Mint Reaper Pass

Mint a Reaper Pass NFT (authority only, max 1666).

**Accounts**:
- `config` (mut) - VaultConfig PDA
- `reaper_mint` (mut) - Reaper Pass mint
- `recipient_token_account` (init) - Recipient's token account
- `recipient` - Recipient public key
- `authority` (signer) - Program authority
- `metadata` - Metaplex metadata account
- `master_edition` - Metaplex master edition account

**Example**:
```typescript
await program.methods
  .mintReaperPass()
  .accounts({
    config: configPda,
    reaperMint: reaperMint,
    recipientTokenAccount: recipientTokenAccount,
    recipient: recipient.publicKey,
    authority: authority.publicKey,
    metadata: metadataPda,
    masterEdition: masterEditionPda,
  })
  .signers([authority])
  .rpc();
```

### 7. Midnight Harvest

Execute automated daily compounding with soul tax and charity donation.

**Accounts**:
- `vault` (mut) - Vault PDA
- `config` - VaultConfig PDA
- `owner_reaper_account` (optional) - Owner's Reaper Pass token account
- `reaper_mint` - Reaper Pass mint
- `charity_wallet` - Solana Foundation wallet
- `vault_token_account` - Vault's token account
- `charity_token_account` - Charity's token account

**Mechanics**:
- 13% soul tax (tracked for burning)
- 1% charity donation (sent to Solana Foundation)
- 86% net reward (added to vault balance)

**Example**:
```typescript
const result = await program.methods
  .midnightHarvest()
  .accounts({
    vault: vaultPda,
    config: configPda,
    ownerReaperAccount: userReaperAccount,
    reaperMint: reaperMint,
    charityWallet: solanaFoundationWallet,
    vaultTokenAccount: vaultTokenAccount,
    charityTokenAccount: charityTokenAccount,
  })
  .rpc();

console.log("Rewards:", result.rewards);
console.log("Soul Tax:", result.soulTax);
console.log("Charity:", result.charityAmount);
console.log("Net Reward:", result.netReward);
```

For automated execution, see [MIDNIGHT_HARVEST.md](./MIDNIGHT_HARVEST.md).

## Deployment

### Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor 0.29+
- Node.js 18+

### Build

```bash
# Install dependencies
npm install

# Build the program
anchor build

# Run tests
anchor test
```

### Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Create a keypair for the program (if not exists)
solana-keygen new -o target/deploy/soul_harvest_vault-keypair.json

# Airdrop SOL for deployment
solana airdrop 2

# Deploy the program
anchor deploy --provider.cluster devnet

# Update the program ID in lib.rs and Anchor.toml
# Then rebuild and redeploy
anchor build
anchor deploy --provider.cluster devnet
```

### Deploy to Mainnet

```bash
# Configure Solana CLI for mainnet
solana config set --url mainnet-beta

# Ensure you have enough SOL for deployment
solana balance

# Deploy the program
anchor deploy --provider.cluster mainnet-beta

# Initialize the program
# (Use your client application or CLI to call initialize instruction)
```

## Client Integration

### TypeScript/JavaScript

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoulHarvestVault } from "../target/types/soul_harvest_vault";

// Initialize connection
const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
const wallet = anchor.Wallet.local();
const provider = new anchor.AnchorProvider(connection, wallet, {});
anchor.setProvider(provider);

// Load program
const programId = new anchor.web3.PublicKey("YOUR_PROGRAM_ID");
const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;

// Derive PDAs
const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    owner.publicKey.toBuffer(),
    tokenMint.toBuffer(),
  ],
  program.programId
);

const [leaderboardPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("leaderboard"), owner.publicKey.toBuffer()],
  program.programId
);

// Create vault
await program.methods
  .createVault(new anchor.BN(1000))
  .accounts({
    vault: vaultPda,
    leaderboardEntry: leaderboardPda,
    owner: owner.publicKey,
    tokenMint: tokenMint,
    ownerTokenAccount: ownerTokenAccount,
    vaultTokenAccount: vaultTokenAccount,
  })
  .signers([owner])
  .rpc();

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

// Fetch vault data
const vaultAccount = await program.account.vault.fetch(vaultPda);
console.log("Balance:", vaultAccount.balance.toString());
console.log("Souls:", vaultAccount.totalSoulsHarvested.toString());
```

### Rust

```rust
use anchor_client::solana_sdk::pubkey::Pubkey;
use anchor_client::solana_sdk::signature::{Keypair, Signer};
use anchor_client::{Client, Cluster};

// Initialize client
let payer = Keypair::new();
let client = Client::new(Cluster::Devnet, Rc::new(payer));
let program = client.program(program_id)?;

// Derive PDAs
let (config_pda, _) = Pubkey::find_program_address(
    &[b"config"],
    &program.id(),
);

let (vault_pda, _) = Pubkey::find_program_address(
    &[b"vault", owner.pubkey().as_ref(), token_mint.as_ref()],
    &program.id(),
);

// Create vault
program
    .request()
    .accounts(soul_harvest_vault::accounts::CreateVault {
        vault: vault_pda,
        leaderboard_entry: leaderboard_pda,
        owner: owner.pubkey(),
        token_mint,
        owner_token_account,
        vault_token_account,
        token_program: anchor_spl::token::ID,
        system_program: anchor_lang::system_program::ID,
        rent: anchor_lang::solana_program::sysvar::rent::ID,
    })
    .args(soul_harvest_vault::instruction::CreateVault {
        initial_deposit: 1000,
    })
    .signer(&owner)
    .send()?;
```

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 6000 | InsufficientFunds | User doesn't have enough tokens for operation |
| 6001 | InsufficientBalance | Withdrawal amount exceeds vault balance |
| 6002 | NonZeroBalance | Cannot close vault with non-zero balance |
| 6003 | VaultInactive | Cannot compound inactive vault |
| 6004 | SupplyExhausted | Reaper Pass supply limit (1666) reached |
| 6005 | Unauthorized | Only authority can perform this action |
| 6006 | InvalidMint | Token mint doesn't match expected mint |
| 6007 | ArithmeticOverflow | Calculation resulted in overflow |
| 6008 | InvalidDepositAmount | Deposit amount must be greater than zero |

## Security Considerations

- All accounts use PDAs to prevent unauthorized access
- Critical operations require owner/authority signatures
- Checked arithmetic prevents integer overflow/underflow
- Anchor constraints validate account ownership and types
- Token accounts verified to match expected mints
- Hard cap enforced on Reaper Pass minting (1666)
- All accounts are rent-exempt

## Testing

```bash
# Run all tests
anchor test

# Run tests with logs
anchor test -- --nocapture

# Run specific test
anchor test --skip-build -- test_name
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For questions or issues, please open an issue on GitHub.
