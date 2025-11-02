use anchor_lang::prelude::*;

use crate::state::{Vault, LeaderboardEntry};
use crate::errors::VaultError;

/// Close a vault and reclaim rent
#[derive(Accounts)]
pub struct CloseVault<'info> {
    /// Vault account (PDA) - will be closed
    #[account(
        mut,
        seeds = [Vault::SEED_PREFIX, owner.key().as_ref(), vault.token_mint.as_ref()],
        bump = vault.bump,
        has_one = owner @ VaultError::Unauthorized,
        close = owner
    )]
    pub vault: Account<'info, Vault>,
    
    /// Leaderboard entry for the user (PDA) - will be closed
    #[account(
        mut,
        seeds = [LeaderboardEntry::SEED_PREFIX, owner.key().as_ref()],
        bump = leaderboard_entry.bump,
        close = owner
    )]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,
    
    /// Vault owner (must be signer, receives rent)
    #[account(mut)]
    pub owner: Signer<'info>,
}

/// Close vault instruction handler
pub fn handler(ctx: Context<CloseVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    
    // Verify vault balance is zero
    require!(vault.balance == 0, VaultError::NonZeroBalance);
    
    // Set vault to inactive before closing
    vault.is_active = false;
    
    msg!("Vault closed successfully");
    msg!("Owner: {}", vault.owner);
    msg!("Token mint: {}", vault.token_mint);
    msg!("Total souls harvested: {}", vault.total_souls_harvested);
    
    // Accounts are automatically closed and rent returned to owner
    // due to the 'close = owner' constraint in the account definitions
    
    Ok(())
}
