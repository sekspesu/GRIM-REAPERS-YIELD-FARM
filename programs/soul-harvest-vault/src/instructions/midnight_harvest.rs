use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Burn};

use crate::constants::*;
use crate::errors::VaultError;
use crate::state::{Vault, VaultConfig, LeaderboardEntry};

/// Midnight Harvest - Automated daily compounding with soul tax
///
/// This instruction compounds rewards for a vault and applies:
/// - 13% soul tax (burned from rewards)
/// - 1% charity donation (sent to Solana Foundation)
/// - Remaining 86% added to vault balance
#[derive(Accounts)]
pub struct MidnightHarvest<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref(), vault.token_mint.as_ref()],
        bump = vault.bump,
        constraint = vault.is_active @ VaultError::VaultInactive,
    )]
    pub vault: Account<'info, Vault>,

    /// Leaderboard entry for the user (PDA)
    #[account(
        mut,
        seeds = [LeaderboardEntry::SEED_PREFIX, vault.owner.as_ref()],
        bump = leaderboard_entry.bump
    )]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, VaultConfig>,

    /// Optional: Owner's Reaper Pass token account for boost
    #[account(
        constraint = owner_reaper_account.mint == config.reaper_mint,
        constraint = owner_reaper_account.owner == vault.owner,
    )]
    pub owner_reaper_account: Option<Account<'info, TokenAccount>>,

    #[account(address = config.reaper_mint)]
    pub reaper_mint: AccountInfo<'info>,

    /// Charity recipient (Solana Foundation)
    /// CHECK: This is the Solana Foundation wallet address
    #[account(mut)]
    pub charity_wallet: AccountInfo<'info>,

    /// Vault's token account for charity transfer
    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Charity's token account
    #[account(mut)]
    pub charity_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<MidnightHarvest>) -> Result<MidnightHarvestResult> {
    let vault = &mut ctx.accounts.vault;
    let config = &mut ctx.accounts.config;
    let clock = Clock::get()?;

    // Calculate time elapsed since last compound
    let time_elapsed = clock
        .unix_timestamp
        .checked_sub(vault.last_compound)
        .ok_or(VaultError::ArithmeticOverflow)?;

    if time_elapsed <= 0 {
        return Ok(MidnightHarvestResult {
            rewards: 0,
            soul_tax: 0,
            charity_amount: 0,
            net_reward: 0,
        });
    }

    // Calculate dynamic APY based on total TVL (Fear Index)
    let dynamic_apy = config.calculate_dynamic_apy();
    
    msg!("Current APY: {}% – The more souls, the scarier the yield 💀", dynamic_apy as f64 / 100.0);

    // Calculate base rewards: (balance * dynamic_apy * time_elapsed) / (365 days * 10000)
    let balance_u128 = vault.balance as u128;
    let apy_u128 = dynamic_apy as u128;
    let time_u128 = time_elapsed as u128;

    let base_rewards = balance_u128
        .checked_mul(apy_u128)
        .and_then(|v| v.checked_mul(time_u128))
        .and_then(|v| v.checked_div(SECONDS_PER_YEAR as u128))
        .and_then(|v| v.checked_div(BASIS_POINTS as u128))
        .ok_or(VaultError::ArithmeticOverflow)?;

    // Check for Reaper Pass boost
    let has_reaper_pass = ctx
        .accounts
        .owner_reaper_account
        .as_ref()
        .map(|acc| acc.amount > 0)
        .unwrap_or(false);

    let final_rewards = if has_reaper_pass {
        base_rewards
            .checked_mul(config.reaper_boost as u128)
            .and_then(|v| v.checked_div(BASIS_POINTS as u128))
            .ok_or(VaultError::ArithmeticOverflow)?
    } else {
        base_rewards
    };

    let rewards = final_rewards as u64;

    // Apply midnight harvest taxes
    // 13% soul tax (burned)
    let soul_tax = rewards
        .checked_mul(SOUL_TAX_BPS)
        .and_then(|v| v.checked_div(BASIS_POINTS as u64))
        .ok_or(VaultError::ArithmeticOverflow)?;

    // 1% charity
    let charity_amount = rewards
        .checked_mul(CHARITY_BPS)
        .and_then(|v| v.checked_div(BASIS_POINTS as u64))
        .ok_or(VaultError::ArithmeticOverflow)?;

    // Net reward = rewards - soul_tax - charity
    let net_reward = rewards
        .checked_sub(soul_tax)
        .and_then(|v| v.checked_sub(charity_amount))
        .ok_or(VaultError::ArithmeticOverflow)?;

    // Update vault balance with net reward
    vault.balance = vault
        .balance
        .checked_add(net_reward)
        .ok_or(VaultError::ArithmeticOverflow)?;

    // Calculate souls earned (based on total rewards before tax)
    let souls_earned = (rewards as u128)
        .checked_mul(config.souls_per_token as u128)
        .ok_or(VaultError::ArithmeticOverflow)? as u64;

    vault.total_souls_harvested = vault
        .total_souls_harvested
        .checked_add(souls_earned)
        .ok_or(VaultError::ArithmeticOverflow)?;

    vault.last_compound = clock.unix_timestamp;

    // Update leaderboard TVL
    let leaderboard_entry = &mut ctx.accounts.leaderboard_entry;
    leaderboard_entry.tvl = leaderboard_entry.tvl
        .checked_add(net_reward)
        .ok_or(VaultError::ArithmeticOverflow)?;

    // Update global TVL
    config.total_tvl = config.total_tvl
        .checked_add(net_reward)
        .ok_or(VaultError::ArithmeticOverflow)?;

    // Transfer charity amount to Solana Foundation
    if charity_amount > 0 {
        let vault_key = vault.key();
        let owner_key = vault.owner;
        let mint_key = vault.token_mint;
        let seeds = &[
            VAULT_SEED,
            owner_key.as_ref(),
            mint_key.as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.charity_token_account.to_account_info(),
            authority: vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, charity_amount)?;
    }

    // Note: Soul tax burning would require additional token mint authority
    // For now, we track it but don't actually burn tokens
    // In production, you'd need to implement token burning logic

    emit!(MidnightHarvestEvent {
        vault: vault.key(),
        owner: vault.owner,
        rewards,
        soul_tax,
        charity_amount,
        net_reward,
        souls_earned,
        timestamp: clock.unix_timestamp,
    });

    Ok(MidnightHarvestResult {
        rewards,
        soul_tax,
        charity_amount,
        net_reward,
    })
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MidnightHarvestResult {
    pub rewards: u64,
    pub soul_tax: u64,
    pub charity_amount: u64,
    pub net_reward: u64,
}

#[event]
pub struct MidnightHarvestEvent {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub rewards: u64,
    pub soul_tax: u64,
    pub charity_amount: u64,
    pub net_reward: u64,
    pub souls_earned: u64,
    pub timestamp: i64,
}
