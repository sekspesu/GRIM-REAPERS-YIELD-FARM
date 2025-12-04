//! # Soul Harvest Vault
//!
//! A Solana-based DeFi protocol that enables users to deposit tokens into vaults
//! that automatically compound rewards over time with gamified "soul harvesting" mechanics.
//!
//! ## Features
//!
//! - **Token Vaults**: Create vaults to stake tokens and earn compounding rewards
//! - **Soul Harvesting**: Accumulate souls based on vault activity and rewards
//! - **Reaper Pass NFTs**: Limited-edition NFTs (1666 supply) that provide 2x reward boost
//! - **Leaderboard**: Track and rank users by Total Value Locked (TVL)
//! - **Automatic Compounding**: Time-based reward calculation with APY
//!
//! ## Program Instructions
//!
//! - `initialize`: Set up the program configuration and Reaper Pass mint
//! - `create_vault`: Create a new vault with an initial token deposit
//! - `compound`: Calculate and compound rewards based on time elapsed
//! - `withdraw`: Withdraw tokens from a vault
//! - `close_vault`: Close an empty vault and reclaim rent
//! - `mint_reaper_pass`: Mint a Reaper Pass NFT (authority only)
//!
//! ## Account Structure
//!
//! - `VaultConfig`: Global program configuration (PDA: ["config"])
//! - `Vault`: Individual user vault (PDA: ["vault", owner, token_mint])
//! - `LeaderboardEntry`: User's leaderboard entry (PDA: ["leaderboard", user])

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("CM7bjZs41G4ryhjUMptVRLLd1ojwxHrrE5sGfEGqV5h");

#[program]
pub mod soul_harvest_vault {
    use super::*;

    /// Initialize the Soul Harvest Vault program
    ///
    /// Creates the global VaultConfig account and Reaper Pass mint.
    /// This must be called once before any other instructions.
    ///
    /// # Arguments
    ///
    /// * `base_apy` - Base APY in basis points (e.g., 1000 = 10%)
    /// * `souls_per_token` - Number of souls earned per token compounded
    ///
    /// # Accounts
    ///
    /// * `config` - VaultConfig PDA (initialized)
    /// * `reaper_mint` - Reaper Pass mint account (initialized)
    /// * `authority` - Program authority (signer, payer)
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Initialize with 10% APY and 1 soul per token
    /// initialize(ctx, 1000, 1)?;
    /// ```
    pub fn initialize(
        ctx: Context<Initialize>,
        base_apy: u16,
        souls_per_token: u64,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, base_apy, souls_per_token)
    }

    /// Create a new vault with an initial deposit
    ///
    /// Creates a vault for the signer to stake tokens and earn rewards.
    /// Also creates a leaderboard entry for the user.
    ///
    /// # Arguments
    ///
    /// * `initial_deposit` - Amount of tokens to deposit (must be > 0)
    ///
    /// # Accounts
    ///
    /// * `vault` - Vault PDA (initialized)
    /// * `leaderboard_entry` - LeaderboardEntry PDA (initialized)
    /// * `owner` - Vault owner (signer, payer)
    /// * `token_mint` - Token mint being staked
    /// * `owner_token_account` - Owner's token account (source)
    /// * `vault_token_account` - Vault's token account (initialized)
    ///
    /// # Errors
    ///
    /// * `InvalidDepositAmount` - If initial_deposit is 0
    /// * `InsufficientFunds` - If owner doesn't have enough tokens
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Create vault with 1000 tokens
    /// create_vault(ctx, 1000)?;
    /// ```
    pub fn create_vault(
        ctx: Context<CreateVault>,
        initial_deposit: u64,
    ) -> Result<()> {
        instructions::create_vault::handler(ctx, initial_deposit)
    }

    /// Compound rewards for a vault
    ///
    /// Calculates rewards based on time elapsed since last compound and adds them
    /// to the vault balance. If the owner holds a Reaper Pass NFT, applies a 2x boost.
    /// Also calculates and adds souls to the vault's total.
    ///
    /// # Accounts
    ///
    /// * `vault` - Vault PDA (mutable)
    /// * `config` - VaultConfig PDA
    /// * `owner_reaper_account` - Owner's Reaper Pass token account (optional)
    /// * `reaper_mint` - Reaper Pass mint
    ///
    /// # Errors
    ///
    /// * `VaultInactive` - If vault is not active
    /// * `ArithmeticOverflow` - If calculations overflow
    ///
    /// # Reward Formula
    ///
    /// ```text
    /// base_rewards = (balance * base_apy * time_elapsed) / (365 days * 10000)
    /// if has_reaper_pass:
    ///     final_rewards = base_rewards * (reaper_boost / 10000)
    /// souls = final_rewards * souls_per_token
    /// ```
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Compound rewards (automatically detects Reaper Pass)
    /// compound(ctx)?;
    /// ```
    pub fn compound(ctx: Context<Compound>) -> Result<()> {
        instructions::compound::handler(ctx)
    }

    /// Withdraw tokens from a vault
    ///
    /// Transfers tokens from the vault back to the owner's wallet.
    /// Updates the vault balance and leaderboard TVL.
    /// Can be called even if vault is inactive.
    ///
    /// # Arguments
    ///
    /// * `amount` - Amount of tokens to withdraw
    ///
    /// # Accounts
    ///
    /// * `vault` - Vault PDA (mutable)
    /// * `leaderboard_entry` - LeaderboardEntry PDA (mutable)
    /// * `owner` - Vault owner (signer)
    /// * `vault_token_account` - Vault's token account (source)
    /// * `owner_token_account` - Owner's token account (destination)
    ///
    /// # Errors
    ///
    /// * `InsufficientBalance` - If amount exceeds vault balance
    /// * `Unauthorized` - If signer is not the vault owner
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Withdraw 500 tokens
    /// withdraw(ctx, 500)?;
    /// ```
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }

    /// Close a vault and reclaim rent
    ///
    /// Closes the vault and leaderboard entry accounts, returning rent to the owner.
    /// Vault balance must be zero before closing.
    ///
    /// # Accounts
    ///
    /// * `vault` - Vault PDA (closed)
    /// * `leaderboard_entry` - LeaderboardEntry PDA (closed)
    /// * `owner` - Vault owner (signer, receives rent)
    ///
    /// # Errors
    ///
    /// * `NonZeroBalance` - If vault balance is not zero
    /// * `Unauthorized` - If signer is not the vault owner
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Close vault after withdrawing all funds
    /// close_vault(ctx)?;
    /// ```
    pub fn close_vault(ctx: Context<CloseVault>) -> Result<()> {
        instructions::close_vault::handler(ctx)
    }

    // TODO: Re-enable after fixing mpl-token-metadata dependency
    // /// Mint a new Reaper Pass NFT (authority only)
    // ///
    // /// Mints a Reaper Pass NFT to a recipient. Only the program authority can call this.
    // /// Enforces a maximum supply of 1666 Reaper Passes.
    // ///
    // /// # Accounts
    // ///
    // /// * `config` - VaultConfig PDA (mutable)
    // /// * `reaper_mint` - Reaper Pass mint (mutable)
    // /// * `recipient_token_account` - Recipient's token account (initialized if needed)
    // /// * `recipient` - Recipient public key
    // /// * `authority` - Program authority (signer, payer)
    // /// * `metadata` - Metaplex metadata account (initialized)
    // /// * `master_edition` - Metaplex master edition account (initialized)
    // ///
    // /// # Errors
    // ///
    // /// * `SupplyExhausted` - If 1666 Reaper Passes have already been minted
    // /// * `Unauthorized` - If signer is not the program authority
    // ///
    // /// # Example
    // ///
    // /// ```ignore
    // /// // Mint Reaper Pass to user
    // /// mint_reaper_pass(ctx)?;
    // /// ```
    // pub fn mint_reaper_pass(ctx: Context<MintReaperPass>) -> Result<()> {
    //     instructions::mint_reaper_pass::handler(ctx)
    // }

    /// Midnight Harvest - Automated daily compounding with soul tax
    ///
    /// Compounds rewards for a vault with special midnight harvest mechanics:
    /// - Calculates rewards based on time elapsed
    /// - Applies 13% soul tax (tracked for burning)
    /// - Sends 1% to charity (Solana Foundation)
    /// - Adds remaining 86% to vault balance
    ///
    /// This instruction is designed to be called by automated keeper bots
    /// at midnight UTC daily for all active vaults.
    ///
    /// # Accounts
    ///
    /// * `vault` - Vault PDA (mutable)
    /// * `config` - VaultConfig PDA
    /// * `owner_reaper_account` - Owner's Reaper Pass token account (optional)
    /// * `reaper_mint` - Reaper Pass mint
    /// * `charity_wallet` - Solana Foundation wallet
    /// * `vault_token_account` - Vault's token account
    /// * `charity_token_account` - Charity's token account
    ///
    /// # Returns
    ///
    /// * `MidnightHarvestResult` - Details of rewards, taxes, and net amounts
    ///
    /// # Errors
    ///
    /// * `VaultInactive` - If vault is not active
    /// * `ArithmeticOverflow` - If calculations overflow
    ///
    /// # Example
    ///
    /// ```ignore
    /// // Execute midnight harvest for a vault
    /// let result = midnight_harvest(ctx)?;
    /// msg!("Harvested {} souls with {} tax", result.net_reward, result.soul_tax);
    /// ```
    pub fn midnight_harvest(ctx: Context<MidnightHarvest>) -> Result<MidnightHarvestResult> {
        instructions::midnight_harvest::handler(ctx)
    }
}
