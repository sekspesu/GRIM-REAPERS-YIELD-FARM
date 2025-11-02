use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::{Vault, VaultConfig, LeaderboardEntry};
use crate::errors::VaultError;
use crate::constants::*;

/// Compound rewards for a vault
/// Calculates rewards based on time elapsed and applies Reaper Pass boost if applicable
#[derive(Accounts)]
pub struct Compound<'info> {
    /// Vault account to compound rewards for
    #[account(
        mut,
        seeds = [Vault::SEED_PREFIX, vault.owner.as_ref(), vault.token_mint.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,
    
    /// Leaderboard entry for the user (PDA)
    #[account(
        mut,
        seeds = [LeaderboardEntry::SEED_PREFIX, vault.owner.as_ref()],
        bump = leaderboard_entry.bump
    )]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,
    
    /// Global configuration account
    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX],
        bump = config.bump,
    )]
    pub config: Account<'info, VaultConfig>,
    
    /// Owner's Reaper Pass token account (optional, used to check for boost)
    /// If this account has balance > 0, the owner holds a Reaper Pass
    pub owner_reaper_account: Option<Account<'info, TokenAccount>>,
    
    /// Reaper Pass mint (used to verify the token account)
    pub reaper_mint: Account<'info, Mint>,
    
    /// Clock sysvar for timestamp
    pub clock: Sysvar<'info, Clock>,
}

/// Compound instruction handler
pub fn handler(ctx: Context<Compound>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let config = &ctx.accounts.config;
    let clock = &ctx.accounts.clock;
    
    // Validate vault is active (Requirement 2.4)
    require!(vault.is_active, VaultError::VaultInactive);
    
    // Get current timestamp
    let current_time = clock.unix_timestamp;
    
    // Calculate time elapsed since last compound (in seconds)
    let time_elapsed = current_time
        .checked_sub(vault.last_compound)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    // If no time has elapsed, no rewards to compound
    if time_elapsed <= 0 {
        msg!("No time elapsed since last compound");
        return Ok(());
    }
    
    // Calculate dynamic APY based on total TVL (Fear Index)
    let dynamic_apy = config.calculate_dynamic_apy();
    
    msg!("Current APY: {}% – The more souls, the scarier the yield 💀", dynamic_apy as f64 / 100.0);
    
    // Calculate base rewards using the formula:
    // (balance * dynamic_apy * time_elapsed) / (365 * 24 * 60 * 60 * 10000)
    let balance_u128 = vault.balance as u128;
    let base_apy_u128 = dynamic_apy as u128;
    let time_elapsed_u128 = time_elapsed as u128;
    let seconds_per_year_u128 = SECONDS_PER_YEAR as u128;
    let basis_points_divisor_u128 = BASIS_POINTS_DIVISOR as u128;
    
    // Calculate: balance * base_apy * time_elapsed
    let numerator = balance_u128
        .checked_mul(base_apy_u128)
        .ok_or(VaultError::ArithmeticOverflow)?
        .checked_mul(time_elapsed_u128)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    // Calculate: 365 * 24 * 60 * 60 * 10000
    let denominator = seconds_per_year_u128
        .checked_mul(basis_points_divisor_u128)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    // Calculate base rewards
    let mut rewards = numerator
        .checked_div(denominator)
        .ok_or(VaultError::ArithmeticOverflow)? as u64;
    
    // Check if owner holds Reaper Pass NFT
    let has_reaper_pass = if let Some(reaper_account) = &ctx.accounts.owner_reaper_account {
        // Verify the token account is for the correct mint
        require!(
            reaper_account.mint == ctx.accounts.reaper_mint.key(),
            VaultError::InvalidMint
        );
        
        // Check if balance > 0
        reaper_account.amount > 0
    } else {
        false
    };
    
    // Apply Reaper Pass boost if applicable (Requirement 3.1, 3.2)
    if has_reaper_pass {
        let rewards_u128 = rewards as u128;
        let reaper_boost_u128 = config.reaper_boost as u128;
        
        // Apply boost: rewards *= reaper_boost / 10000
        rewards = rewards_u128
            .checked_mul(reaper_boost_u128)
            .ok_or(VaultError::ArithmeticOverflow)?
            .checked_div(basis_points_divisor_u128)
            .ok_or(VaultError::ArithmeticOverflow)? as u64;
        
        msg!("Reaper Pass boost applied: {}x", config.reaper_boost as f64 / BASIS_POINTS_DIVISOR as f64);
    }
    
    // Calculate souls earned (Requirement 2.5)
    let souls_earned = (rewards as u128)
        .checked_mul(config.souls_per_token as u128)
        .ok_or(VaultError::ArithmeticOverflow)? as u64;
    
    // Update vault state (Requirement 2.2, 2.3, 2.5)
    vault.balance = vault.balance
        .checked_add(rewards)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    vault.total_souls_harvested = vault.total_souls_harvested
        .checked_add(souls_earned)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    vault.last_compound = current_time;
    
    // Update leaderboard TVL
    let leaderboard_entry = &mut ctx.accounts.leaderboard_entry;
    leaderboard_entry.tvl = leaderboard_entry.tvl
        .checked_add(rewards)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    // Update global TVL
    let config = &mut ctx.accounts.config;
    config.total_tvl = config.total_tvl
        .checked_add(rewards)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    msg!("Compound executed successfully");
    msg!("Time elapsed: {} seconds", time_elapsed);
    msg!("Rewards compounded: {}", rewards);
    msg!("Souls harvested: {}", souls_earned);
    msg!("New balance: {}", vault.balance);
    msg!("Total souls: {}", vault.total_souls_harvested);
    msg!("Global TVL: {}", config.total_tvl);
    
    Ok(())
}
