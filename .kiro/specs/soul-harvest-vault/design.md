# Soul Harvest Vault - Design Document

## Overview

The Soul Harvest Vault is a Solana program built using the Anchor framework that implements a token staking system with gamified rewards. The program manages user vaults, handles automatic compounding, integrates with Metaplex NFTs for boost mechanics, and maintains an on-chain leaderboard.

### Key Design Decisions

1. **Anchor Framework**: Use Anchor for type safety, account validation, and reduced boilerplate
2. **PDA-based Architecture**: Derive all program accounts from PDAs for security and predictability
3. **Metaplex Integration**: Leverage Metaplex Token Metadata for Reaper Pass NFT verification
4. **Efficient Leaderboard**: Use a linked-list or vector-based approach with periodic rank updates
5. **Time-based Rewards**: Calculate rewards based on elapsed time since last compound using on-chain clock

## Architecture

### Program Structure

```
soul-harvest-vault/
├── programs/
│   └── soul-harvest-vault/
│       ├── src/
│       │   ├── lib.rs              # Program entry point
│       │   ├── state/
│       │   │   ├── mod.rs
│       │   │   ├── vault.rs        # Vault account
│       │   │   ├── leaderboard.rs  # Leaderboard account
│       │   │   └── config.rs       # Global config
│       │   ├── instructions/
│       │   │   ├── mod.rs
│       │   │   ├── initialize.rs   # Initialize program
│       │   │   ├── create_vault.rs
│       │   │   ├── compound.rs
│       │   │   ├── withdraw.rs
│       │   │   ├── close_vault.rs
│       │   │   └── mint_reaper.rs
│       │   ├── errors.rs
│       │   └── constants.rs
│       └── Cargo.toml
└── tests/
    └── soul-harvest-vault.ts
```

## Components and Interfaces

### State Accounts

#### VaultConfig (Global Configuration)
```rust
#[account]
pub struct VaultConfig {
    pub authority: Pubkey,           // Program authority
    pub reaper_mint: Pubkey,         // Reaper Pass NFT mint
    pub reaper_supply: u16,          // Current minted supply
    pub base_apy: u16,               // Base APY in basis points (e.g., 1000 = 10%)
    pub reaper_boost: u16,           // Boost multiplier in basis points (e.g., 20000 = 2.0x)
    pub souls_per_token: u64,        // Souls earned per token compounded
    pub bump: u8,
}
```

**PDA Seeds**: `["config"]`

#### Vault
```rust
#[account]
pub struct Vault {
    pub owner: Pubkey,               // Vault owner
    pub token_mint: Pubkey,          // Token being staked
    pub balance: u64,                // Current token balance
    pub last_compound: i64,          // Last compound timestamp
    pub total_souls_harvested: u64,  // Cumulative souls earned
    pub is_active: bool,             // Vault status
    pub bump: u8,
}
```

**PDA Seeds**: `["vault", owner.key(), token_mint.key()]`

#### LeaderboardEntry
```rust
#[account]
pub struct LeaderboardEntry {
    pub user: Pubkey,                // User public key
    pub tvl: u64,                    // Total value locked
    pub rank: u32,                   // Current rank (0-indexed)
    pub bump: u8,
}
```

**PDA Seeds**: `["leaderboard", user.key()]`

### Instructions

#### 1. Initialize
Initializes the program configuration and creates the Reaper Pass master mint.

**Accounts:**
- `config` (init): VaultConfig PDA
- `reaper_mint` (init): Reaper Pass mint account
- `authority` (signer): Program authority
- `system_program`: System program
- `token_program`: SPL Token program
- `rent`: Rent sysvar

**Parameters:**
- `base_apy: u16`
- `souls_per_token: u64`

#### 2. CreateVault
Creates a new vault for a user with an initial deposit.

**Accounts:**
- `vault` (init): Vault PDA
- `leaderboard_entry` (init): LeaderboardEntry PDA
- `owner` (signer): Vault owner
- `token_mint`: Token mint being staked
- `owner_token_account` (mut): Owner's token account
- `vault_token_account` (init): Vault's token account
- `token_program`: SPL Token program
- `system_program`: System program
- `rent`: Rent sysvar

**Parameters:**
- `initial_deposit: u64`

**Logic:**
1. Validate initial_deposit > 0
2. Create vault PDA with owner and token_mint
3. Create associated token account for vault
4. Transfer tokens from owner to vault
5. Initialize vault state
6. Create leaderboard entry with TVL = initial_deposit
7. Emit VaultCreated event

#### 3. Compound
Compounds rewards for a vault, calculating based on time elapsed.

**Accounts:**
- `vault` (mut): Vault PDA
- `config`: VaultConfig PDA
- `owner_reaper_account`: Owner's Reaper Pass token account (optional)
- `reaper_mint`: Reaper Pass mint
- `clock`: Clock sysvar

**Logic:**
1. Verify vault is active
2. Calculate time elapsed since last_compound
3. Check if owner holds Reaper Pass NFT
4. Calculate base rewards: `(balance * base_apy * time_elapsed) / (365 days * 10000)`
5. Apply boost if Reaper Pass held: `rewards *= reaper_boost / 10000`
6. Calculate souls: `rewards * souls_per_token`
7. Update vault: balance += rewards, total_souls_harvested += souls, last_compound = now
8. Emit CompoundExecuted event

#### 4. Withdraw
Withdraws tokens from a vault.

**Accounts:**
- `vault` (mut): Vault PDA
- `leaderboard_entry` (mut): LeaderboardEntry PDA
- `owner` (signer): Vault owner
- `vault_token_account` (mut): Vault's token account
- `owner_token_account` (mut): Owner's token account
- `token_program`: SPL Token program

**Parameters:**
- `amount: u64`

**Logic:**
1. Verify owner matches vault.owner
2. Verify amount <= vault.balance
3. Transfer tokens from vault to owner
4. Update vault.balance -= amount
5. Update leaderboard_entry.tvl -= amount
6. Emit WithdrawalExecuted event

#### 5. CloseVault
Closes a vault and reclaims rent.

**Accounts:**
- `vault` (mut, close): Vault PDA
- `leaderboard_entry` (mut, close): LeaderboardEntry PDA
- `owner` (signer, mut): Vault owner (receives rent)

**Logic:**
1. Verify owner matches vault.owner
2. Verify vault.balance == 0
3. Set vault.is_active = false
4. Close vault account (rent to owner)
5. Close leaderboard_entry account
6. Emit VaultClosed event

#### 6. MintReaperPass
Mints a new Reaper Pass NFT (authority only).

**Accounts:**
- `config` (mut): VaultConfig PDA
- `reaper_mint` (mut): Reaper Pass mint
- `recipient_token_account` (init): Recipient's token account
- `recipient`: Recipient public key
- `authority` (signer): Program authority
- `metadata`: Metaplex metadata account
- `master_edition`: Metaplex master edition account
- `token_program`: SPL Token program
- `token_metadata_program`: Metaplex Token Metadata program
- `system_program`: System program
- `rent`: Rent sysvar

**Logic:**
1. Verify signer is config.authority
2. Verify config.reaper_supply < 1666
3. Mint 1 token to recipient
4. Create Metaplex metadata with:
   - name: "Kiroween Reaper Pass"
   - symbol: "REAPER"
   - uri: "https://arweave.net/halloween-reaper.json"
5. Create master edition (supply = 1 for NFT)
6. Increment config.reaper_supply
7. Emit ReaperPassMinted event

## Data Models

### Reward Calculation Formula

```
time_elapsed = current_time - last_compound
base_rewards = (balance * base_apy * time_elapsed) / (365 * 24 * 60 * 60 * 10000)

if has_reaper_pass:
    final_rewards = base_rewards * (reaper_boost / 10000)
else:
    final_rewards = base_rewards

souls_earned = final_rewards * souls_per_token
```

### Leaderboard Ranking

The leaderboard uses a simple approach where ranks are calculated on-demand during queries:

1. Each user has a LeaderboardEntry with their TVL
2. When querying leaderboard, fetch all entries and sort by TVL descending
3. Assign ranks based on sorted order
4. For efficiency, consider implementing a periodic rank update mechanism via cron or keeper bots

**Alternative Design (Future Optimization):**
- Maintain a sorted vector in a single LeaderboardState account
- Update positions on each TVL change
- Trade-off: More complex updates but faster queries

## Error Handling

### Custom Errors

```rust
#[error_code]
pub enum VaultError {
    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
    
    #[msg("Insufficient balance in vault")]
    InsufficientBalance,
    
    #[msg("Vault balance must be zero to close")]
    NonZeroBalance,
    
    #[msg("Vault is not active")]
    VaultInactive,
    
    #[msg("Reaper Pass supply exhausted")]
    SupplyExhausted,
    
    #[msg("Unauthorized: only authority can perform this action")]
    Unauthorized,
    
    #[msg("Invalid token mint")]
    InvalidMint,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
}
```

### Error Handling Strategy

1. **Input Validation**: Validate all inputs at instruction entry
2. **Checked Math**: Use checked arithmetic operations to prevent overflows
3. **Account Validation**: Leverage Anchor's account constraints
4. **Graceful Failures**: Return descriptive errors rather than panicking
5. **Event Logging**: Emit events for all state changes to enable off-chain monitoring

## Testing Strategy

### Unit Tests (Rust)

1. **State Account Tests**
   - Verify account size calculations
   - Test serialization/deserialization
   - Validate PDA derivation

2. **Calculation Tests**
   - Test reward calculation with various time periods
   - Verify boost multiplier application
   - Test edge cases (zero balance, max values)

### Integration Tests (TypeScript)

1. **Happy Path Tests**
   - Initialize program
   - Create vault with deposit
   - Execute compound
   - Withdraw partial amount
   - Close vault

2. **Reaper Pass Tests**
   - Mint Reaper Pass
   - Verify boost application
   - Test without Reaper Pass
   - Test supply limit enforcement

3. **Leaderboard Tests**
   - Create multiple vaults
   - Verify TVL tracking
   - Test rank calculations
   - Verify updates on deposits/withdrawals

4. **Error Cases**
   - Insufficient funds
   - Unauthorized access
   - Invalid amounts
   - Closing vault with balance
   - Exceeding Reaper Pass supply

5. **Security Tests**
   - Verify PDA ownership
   - Test authority checks
   - Attempt unauthorized minting
   - Test reentrancy protection (via Anchor)

### Test Environment

- Use Solana test validator for local testing
- Use Anchor's testing framework
- Mock time progression for compound testing
- Create helper functions for common operations

## Security Considerations

1. **PDA Derivation**: All accounts use PDAs to prevent unauthorized access
2. **Signer Verification**: Critical operations require owner/authority signatures
3. **Checked Math**: Prevent integer overflow/underflow
4. **Account Validation**: Anchor constraints validate account ownership and types
5. **Token Account Verification**: Verify token accounts match expected mints
6. **Supply Limits**: Enforce hard cap on Reaper Pass minting
7. **Rent Exemption**: Ensure all accounts are rent-exempt

## Performance Considerations

1. **Leaderboard Scalability**: Current design works for ~10k users; consider off-chain indexing for larger scale
2. **Compound Frequency**: No minimum time between compounds; consider adding cooldown if needed
3. **Account Size**: Keep accounts minimal to reduce rent costs
4. **Batch Operations**: Consider adding batch compound for multiple vaults

## Future Enhancements

1. **Multiple Token Support**: Allow different token mints with different APYs
2. **Tiered Rewards**: Implement reward tiers based on vault size or duration
3. **Soul Marketplace**: Allow trading or burning souls for benefits
4. **Governance**: Add DAO governance for parameter updates
5. **Auto-compound**: Implement Clockwork or similar for automatic compounding
6. **Referral System**: Add referral rewards to boost adoption
