use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::VaultConfig;
use crate::constants::*;

/// Initialize the Soul Harvest Vault program
/// Creates the global VaultConfig and Reaper Pass mint
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Global configuration account (PDA)
    #[account(
        init,
        payer = authority,
        space = VaultConfig::LEN,
        seeds = [VaultConfig::SEED_PREFIX],
        bump
    )]
    pub config: Account<'info, VaultConfig>,
    
    /// Reaper Pass NFT mint account
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = config,
    )]
    pub reaper_mint: Account<'info, Mint>,
    
    /// Program authority (pays for account creation)
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// SPL Token program
    pub token_program: Program<'info, Token>,
    
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// Initialize instruction handler
pub fn handler(
    ctx: Context<Initialize>,
    base_apy: u16,
    souls_per_token: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    // Set configuration values
    config.authority = ctx.accounts.authority.key();
    config.reaper_mint = ctx.accounts.reaper_mint.key();
    config.reaper_supply = 0;
    config.base_apy = base_apy;
    config.reaper_boost = DEFAULT_REAPER_BOOST; // 2.0x boost
    config.souls_per_token = souls_per_token;
    config.total_tvl = 0; // Initialize global TVL to 0
    config.bump = ctx.bumps.config;
    
    msg!("Soul Harvest Vault initialized");
    msg!("Authority: {}", config.authority);
    msg!("Reaper Mint: {}", config.reaper_mint);
    msg!("Base APY: {} bps", config.base_apy);
    msg!("Reaper Boost: {} bps", config.reaper_boost);
    msg!("Souls per Token: {}", config.souls_per_token);
    
    Ok(())
}
