use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::{Vault, LeaderboardEntry, VaultConfig};
use crate::errors::VaultError;

use crate::state::{Vault, LeaderboardEntry, VaultConfig};

/// Create a new vault with an initial deposit
#[derive(Accounts)]
pub struct CreateVault<'info> {
    /// Vault account (PDA)
    #[account(
        init,
        payer = owner,
        space = Vault::LEN,
        seeds = [Vault::SEED_PREFIX, owner.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    
    /// Leaderboard entry for the user (PDA)
    #[account(
        init,
        payer = owner,
        space = LeaderboardEntry::LEN,
        seeds = [LeaderboardEntry::SEED_PREFIX, owner.key().as_ref()],
        bump
    )]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,
    
    /// Global configuration account
    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX],
        bump = config.bump,
    )]
    pub config: Account<'info, VaultConfig>,
    
    /// Vault owner (signer and payer)
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// Token mint being staked
    pub token_mint: Account<'info, Mint>,
    
    /// Owner's token account (source of deposit)
    #[account(
        mut,
        constraint = owner_token_account.mint == token_mint.key() @ VaultError::InvalidMint,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    /// Vault's token account (destination for deposit)
    #[account(
        init,
        payer = owner,
        token::mint = token_mint,
        token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    /// SPL Token program
    pub token_program: Program<'info, Token>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// Create vault instruction handler
pub fn handler(
    ctx: Context<CreateVault>,
    initial_deposit: u64,
) -> Result<()> {
    // Validate initial deposit is greater than zero
    require!(initial_deposit > 0, VaultError::InvalidDepositAmount);
    
    // Get current timestamp
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    
    // Transfer tokens from owner to vault token account
    let cpi_accounts = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, initial_deposit)?;
    
    // Initialize vault state
    let vault = &mut ctx.accounts.vault;
    vault.owner = ctx.accounts.owner.key();
    vault.token_mint = ctx.accounts.token_mint.key();
    vault.balance = initial_deposit;
    vault.last_compound = current_time;
    vault.total_souls_harvested = 0;
    vault.is_active = true;
    vault.bump = ctx.bumps.vault;
    
    // Initialize leaderboard entry
    let leaderboard_entry = &mut ctx.accounts.leaderboard_entry;
    leaderboard_entry.user = ctx.accounts.owner.key();
    leaderboard_entry.tvl = initial_deposit;
    leaderboard_entry.rank = 0;
    leaderboard_entry.bump = ctx.bumps.leaderboard_entry;
    
    // Update global TVL
    let config = &mut ctx.accounts.config;
    config.total_tvl = config.total_tvl
        .checked_add(initial_deposit)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    msg!("Vault created successfully");
    msg!("Owner: {}", vault.owner);
    msg!("Token Mint: {}", vault.token_mint);
    msg!("Initial Balance: {}", vault.balance);
    msg!("Leaderboard TVL: {}", leaderboard_entry.tvl);
    msg!("Global TVL: {}", config.total_tvl);
    
    Ok(())
}
