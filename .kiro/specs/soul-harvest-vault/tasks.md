# Implementation Plan

- [ ] 1. Initialize Anchor project and configure dependencies
  - Create new Anchor workspace with `anchor init soul-harvest-vault`
  - Add Metaplex Token Metadata dependency to Cargo.toml
  - Configure Anchor.toml with appropriate cluster settings
  - Set up TypeScript test environment with necessary imports
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement state account structures




  - [x] 2.1 Create VaultConfig account structure


    - Define VaultConfig struct in `state/config.rs` with all fields (authority, reaper_mint, reaper_supply, base_apy, reaper_boost, souls_per_token, bump)
    - Implement account size calculation and space allocation
    - Add PDA derivation with seeds `["config"]`
    - _Requirements: 1.1, 2.1, 3.1, 7.1_
  
  - [x] 2.2 Create Vault account structure


    - Define Vault struct in `state/vault.rs` with all fields (owner, token_mint, balance, last_compound, total_souls_harvested, is_active, bump)
    - Implement PDA derivation with seeds `["vault", owner, token_mint]`
    - Add account validation constraints
    - _Requirements: 1.1, 1.2, 2.1, 5.1_
  
  - [x] 2.3 Create LeaderboardEntry account structure


    - Define LeaderboardEntry struct in `state/leaderboard.rs` with fields (user, tvl, rank, bump)
    - Implement PDA derivation with seeds `["leaderboard", user]`
    - _Requirements: 4.1, 4.4_

- [x] 3. Implement constants and error types





  - [x] 3.1 Define program constants


    - Create `constants.rs` with PDA seeds, time constants, and calculation constants
    - Define maximum values and limits (e.g., REAPER_MAX_SUPPLY = 1666)
    - _Requirements: 3.5, 7.2_
  
  - [x] 3.2 Create custom error enum


    - Define VaultError enum in `errors.rs` with all error variants (InsufficientFunds, InsufficientBalance, NonZeroBalance, VaultInactive, SupplyExhausted, Unauthorized, InvalidMint, ArithmeticOverflow, InvalidDepositAmount)
    - Add descriptive error messages for each variant
    - _Requirements: 1.5, 5.4, 6.2, 7.4_

- [x] 4. Implement initialize instruction




  - [x] 4.1 Create initialize instruction handler


    - Define Initialize context struct with all required accounts (config, reaper_mint, authority, system_program, token_program, rent)
    - Implement initialize function that creates VaultConfig and Reaper Pass mint
    - Set initial configuration values (base_apy, souls_per_token, reaper_boost = 20000)
    - Initialize reaper_supply to 0
    - _Requirements: 7.1, 7.2_
  
  - [x] 4.2 Write tests for initialize instruction


    - Test successful initialization with valid parameters
    - Verify VaultConfig account is created with correct values
    - Verify Reaper Pass mint is created
    - Test that only authority can initialize
    - _Requirements: 7.1_

- [x] 5. Implement create_vault instruction




  - [x] 5.1 Create create_vault instruction handler


    - Define CreateVault context struct with accounts (vault, leaderboard_entry, owner, token_mint, owner_token_account, vault_token_account, token_program, system_program, rent)
    - Implement validation for initial_deposit > 0
    - Transfer tokens from owner to vault token account
    - Initialize Vault state with owner, token_mint, balance, last_compound (current time), total_souls_harvested (0), is_active (true)
    - Create LeaderboardEntry with user, tvl (initial_deposit), rank (0)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [x] 5.2 Write tests for create_vault instruction


    - Test successful vault creation with valid deposit
    - Verify tokens are transferred correctly
    - Verify vault state is initialized properly
    - Verify leaderboard entry is created
    - Test error case for insufficient funds
    - Test error case for zero deposit
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 6. Implement compound instruction with reward calculation





  - [x] 6.1 Create compound instruction handler


    - Define Compound context struct with accounts (vault, config, owner_reaper_account, reaper_mint, clock)
    - Implement time elapsed calculation (current_time - last_compound)
    - Implement base reward formula: `(balance * base_apy * time_elapsed) / (365 * 24 * 60 * 60 * 10000)`
    - Check if owner holds Reaper Pass NFT by verifying owner_reaper_account balance > 0
    - Apply boost multiplier if Reaper Pass held: `rewards *= reaper_boost / 10000`
    - Calculate souls earned: `rewards * souls_per_token`
    - Update vault: balance += rewards, total_souls_harvested += souls, last_compound = current_time
    - Use checked arithmetic to prevent overflow
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3_
  
  - [x] 6.2 Add vault active status validation


    - Verify vault.is_active is true before allowing compound
    - Return VaultInactive error if vault is not active
    - _Requirements: 2.4_
  
  - [x] 6.3 Write tests for compound instruction


    - Test compound with base rewards (no Reaper Pass)
    - Test compound with Reaper Pass boost
    - Test soul harvesting calculation
    - Test multiple compounds over time
    - Test error case for inactive vault
    - Mock time progression for testing
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 7. Implement withdraw instruction




  - [x] 7.1 Create withdraw instruction handler


    - Define Withdraw context struct with accounts (vault, leaderboard_entry, owner, vault_token_account, owner_token_account, token_program)
    - Verify owner matches vault.owner
    - Verify amount <= vault.balance
    - Transfer tokens from vault to owner using token program
    - Update vault.balance -= amount
    - Update leaderboard_entry.tvl -= amount
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 7.2 Add withdrawal validation for inactive vaults


    - Allow withdrawals even when vault.is_active is false
    - _Requirements: 5.5_
  
  - [x] 7.3 Write tests for withdraw instruction


    - Test successful withdrawal with valid amount
    - Test partial withdrawal
    - Test full withdrawal
    - Verify leaderboard TVL is updated
    - Test error case for insufficient balance
    - Test error case for unauthorized user
    - Test withdrawal from inactive vault
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Implement close_vault instruction




  - [x] 8.1 Create close_vault instruction handler


    - Define CloseVault context struct with accounts (vault, leaderboard_entry, owner)
    - Verify owner matches vault.owner
    - Verify vault.balance == 0
    - Set vault.is_active = false
    - Close vault account and return rent to owner
    - Close leaderboard_entry account
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 8.2 Write tests for close_vault instruction


    - Test successful vault closure with zero balance
    - Verify rent is returned to owner
    - Verify leaderboard entry is removed
    - Test error case for non-zero balance
    - Test error case for unauthorized user
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Implement mint_reaper_pass instruction with Metaplex integration




  - [x] 9.1 Create mint_reaper_pass instruction handler


    - Define MintReaperPass context struct with accounts (config, reaper_mint, recipient_token_account, recipient, authority, metadata, master_edition, token_program, token_metadata_program, system_program, rent)
    - Verify signer is config.authority
    - Verify config.reaper_supply < 1666
    - Mint 1 token to recipient token account
    - Create Metaplex metadata with name "Kiroween Reaper Pass", symbol "REAPER", uri "https://arweave.net/halloween-reaper.json"
    - Create master edition with supply = 1 (NFT)
    - Increment config.reaper_supply
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 3.5_
  
  - [x] 9.2 Write tests for mint_reaper_pass instruction


    - Test successful Reaper Pass minting
    - Verify metadata is created correctly
    - Verify supply counter increments
    - Test supply limit enforcement (1666 max)
    - Test error case for unauthorized minter
    - Test NFT transfer to recipient
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 3.5_

- [x] 10. Implement leaderboard query functionality






  - [x] 10.1 Add leaderboard ranking logic

    - Create helper function to fetch all LeaderboardEntry accounts
    - Sort entries by TVL in descending order
    - Assign ranks based on sorted position
    - Return sorted and ranked entries
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  

  - [x] 10.2 Write tests for leaderboard functionality

    - Create multiple vaults with different TVL values
    - Query leaderboard and verify correct ranking
    - Test rank updates after deposits
    - Test rank updates after withdrawals
    - Verify sorting by TVL descending
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Wire up all instructions in lib.rs





  - Import all instruction modules
  - Define program module with all instruction handlers
  - Ensure all instructions are exposed in the program interface
  - Add program ID declaration
  - _Requirements: All requirements_

- [x] 12. Create comprehensive integration test suite





  - Write end-to-end test covering full user journey (initialize → create vault → compound → withdraw → close)
  - Test Reaper Pass holder journey with boosted rewards
  - Test multi-user leaderboard scenario
  - Test edge cases and error conditions
  - Add helper functions for common test operations
  - _Requirements: All requirements_

- [x] 13. Add program documentation





  - Document all public functions with doc comments
  - Add usage examples in README.md
  - Document deployment process
  - Create API reference for client integration
  - _Requirements: All requirements_
