# Requirements Document

## Introduction

The Soul Harvest Vault system is a Solana-based DeFi protocol that enables users to deposit tokens into vaults that automatically compound rewards over time. The system features a gamified "soul harvesting" mechanism where users accumulate souls based on their vault activity. Users holding special Reaper Pass NFTs receive boosted rewards and early access to features. A leaderboard tracks and ranks users based on their total value locked (TVL).

## Glossary

- **Vault System**: The on-chain program that manages user token deposits, compounding, and soul harvesting
- **Soul**: A unit of reward accumulated by users through vault participation
- **Reaper Pass**: A limited-edition NFT (supply: 1666) that provides 2x boost multiplier and early access privileges
- **TVL (Total Value Locked)**: The total amount of tokens a user has deposited across all vaults
- **Compound**: The automatic reinvestment of earned rewards back into the vault
- **Leaderboard System**: The ranking mechanism that orders users by their TVL

## Requirements

### Requirement 1

**User Story:** As a token holder, I want to create a vault for my tokens, so that I can earn compounding rewards and harvest souls over time

#### Acceptance Criteria

1. WHEN a user initiates vault creation with a valid token mint and initial deposit, THE Vault System SHALL create a new vault account with the user as owner
2. THE Vault System SHALL initialize the vault with balance equal to the deposit amount, lastCompound timestamp set to current time, totalSoulsHarvested set to zero, and isActive set to true
3. WHEN a vault is created, THE Vault System SHALL transfer the specified token amount from the user's wallet to the vault's token account
4. THE Vault System SHALL emit a VaultCreated event containing the vault public key, owner, token mint, and initial balance
5. IF the user's token balance is insufficient for the deposit, THEN THE Vault System SHALL reject the transaction with an InsufficientFunds error

### Requirement 2

**User Story:** As a vault owner, I want my vault to automatically compound rewards, so that I can maximize my returns without manual intervention

#### Acceptance Criteria

1. WHEN a compound operation is triggered for an active vault, THE Vault System SHALL calculate rewards based on time elapsed since lastCompound
2. THE Vault System SHALL add the calculated rewards to the vault balance
3. THE Vault System SHALL update the lastCompound timestamp to the current time
4. WHILE a vault has isActive set to false, THE Vault System SHALL reject any compound operations
5. THE Vault System SHALL calculate souls earned based on the compounded amount and add them to totalSoulsHarvested

### Requirement 3

**User Story:** As a Reaper Pass holder, I want to receive boosted rewards, so that my NFT provides tangible value

#### Acceptance Criteria

1. WHERE a user holds a valid Reaper Pass NFT, THE Vault System SHALL apply a 2.0x multiplier to all soul harvesting calculations
2. WHEN calculating compound rewards for a Reaper Pass holder, THE Vault System SHALL apply the boost multiplier before updating the vault balance
3. THE Vault System SHALL verify Reaper Pass ownership by checking the user's token account for an NFT with the correct mint address
4. IF a user transfers their Reaper Pass to another wallet, THEN THE Vault System SHALL apply standard (non-boosted) rates for subsequent operations
5. THE Vault System SHALL enforce a maximum supply of 1666 Reaper Pass NFTs

### Requirement 4

**User Story:** As a competitive user, I want to see my ranking on the leaderboard, so that I can track my performance against other users

#### Acceptance Criteria

1. THE Vault System SHALL maintain a leaderboard that ranks users by their total TVL across all vaults
2. WHEN a user's vault balance changes, THE Vault System SHALL update the corresponding leaderboard entry with the new TVL
3. THE Vault System SHALL recalculate ranks for all affected leaderboard entries when TVL changes occur
4. THE Vault System SHALL store each leaderboard entry with the user's public key, current TVL, and rank
5. WHEN querying the leaderboard, THE Vault System SHALL return entries sorted by rank in ascending order

### Requirement 5

**User Story:** As a vault owner, I want to withdraw tokens from my vault, so that I can access my funds when needed

#### Acceptance Criteria

1. WHEN a vault owner requests a withdrawal of a valid amount, THE Vault System SHALL transfer the specified tokens from the vault to the owner's wallet
2. THE Vault System SHALL reduce the vault balance by the withdrawal amount
3. THE Vault System SHALL update the leaderboard entry to reflect the reduced TVL
4. IF the withdrawal amount exceeds the vault balance, THEN THE Vault System SHALL reject the transaction with an InsufficientBalance error
5. WHILE a vault has isActive set to false, THE Vault System SHALL allow withdrawals to enable fund recovery

### Requirement 6

**User Story:** As a vault owner, I want to close my vault, so that I can reclaim rent and clean up unused accounts

#### Acceptance Criteria

1. WHEN a vault owner requests vault closure, THE Vault System SHALL verify the vault balance is zero
2. IF the vault balance is greater than zero, THEN THE Vault System SHALL reject the closure with a NonZeroBalance error
3. THE Vault System SHALL set isActive to false before closing the account
4. THE Vault System SHALL transfer the rent-exempt lamports back to the vault owner
5. THE Vault System SHALL remove the corresponding leaderboard entry when a vault is closed

### Requirement 7

**User Story:** As a protocol administrator, I want to mint Reaper Pass NFTs, so that I can distribute them to early supporters and community members

#### Acceptance Criteria

1. WHEN an authorized minter requests Reaper Pass creation, THE Vault System SHALL mint a new NFT with the specified metadata
2. THE Vault System SHALL enforce that total minted Reaper Passes never exceed 1666
3. THE Vault System SHALL set the NFT metadata with name "Kiroween Reaper Pass", symbol "REAPER", and URI "https://arweave.net/halloween-reaper.json"
4. IF the supply limit has been reached, THEN THE Vault System SHALL reject mint requests with a SupplyExhausted error
5. THE Vault System SHALL transfer the newly minted NFT to the specified recipient address
