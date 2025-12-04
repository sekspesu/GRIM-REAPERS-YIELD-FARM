use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{Vault, LeaderboardEntry, VaultConfig};
use crate::errors::VaultError;

/// Withdraw tokens from a vault
#[derive(Accounts)]
pub struct Withdraw<'info> {
    /// Vault account (PDA)
    #[account(
        mut,
        seeds = [Vault::SEED_PREFIX, owner.key().as_ref(), vault.token_mint.as_ref()],
        bump = vault.bump,
        has_one = owner @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,
    
    /// Leaderboard entry for the user (PDA)
    #[account(
        mut,
        seeds = [LeaderboardEntry::SEED_PREFIX, owner.key().as_ref()],
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
    
    /// Vault owner (must be signer)
    pub owner: Signer<'info>,
    
    /// Vault's token account (source of withdrawal)
    #[account(
        mut,
        constraint = vault_token_account.mint == vault.token_mint @ VaultError::InvalidMint,
        constraint = vault_token_account.owner == vault.key()
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    /// Owner's token account (destination for withdrawal)
    #[account(
        mut,
        constraint = owner_token_account.mint == vault.token_mint @ VaultError::InvalidMint,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    /// SPL Token program
    pub token_program: Program<'info, Token>,
}

/// Withdraw instruction handler
pub fn handler(
    ctx: Context<Withdraw>,
    amount: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    
    // Note: Withdrawals are allowed even when vault.is_active is false
    // This enables fund recovery from inactive vaults
    
    // Verify amount does not exceed vault balance
    require!(amount <= vault.balance, VaultError::InsufficientBalance);
    
    // Transfer tokens from vault to owner using PDA as authority
    let owner_key = ctx.accounts.owner.key();
    let seeds = &[
        Vault::SEED_PREFIX,
        owner_key.as_ref(),
        vault.token_mint.as_ref(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.owner_token_account.to_account_info(),
        authority: vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::transfer(cpi_ctx, amount)?;
    
    // Update vault balance
    vault.balance = vault.balance.checked_sub(amount)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    // Update leaderboard TVL
    let leaderboard_entry = &mut ctx.accounts.leaderboard_entry;
    leaderboard_entry.tvl = leaderboard_entry.tvl.checked_sub(amount)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    // Update global TVL
    let config = &mut ctx.accounts.config;
    config.total_tvl = config.total_tvl.checked_sub(amount)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    msg!("Withdrawal successful");
    msg!("Amount: {}", amount);
    msg!("New vault balance: {}", vault.balance);
    msg!("New leaderboard TVL: {}", leaderboard_entry.tvl);
    msg!("Global TVL: {}", config.total_tvl);
    
    Ok(())
}
