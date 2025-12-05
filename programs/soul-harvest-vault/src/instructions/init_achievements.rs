//! Initialize user achievements account
//!
//! Creates the UserAchievements PDA for a user to track their progress.

use anchor_lang::prelude::*;
use crate::state::UserAchievements;

#[derive(Accounts)]
pub struct InitAchievements<'info> {
    #[account(
        init,
        payer = user,
        space = UserAchievements::LEN,
        seeds = [UserAchievements::SEED_PREFIX, user.key().as_ref()],
        bump
    )]
    pub achievements: Account<'info, UserAchievements>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitAchievements>) -> Result<()> {
    let achievements = &mut ctx.accounts.achievements;
    let clock = Clock::get()?;
    
    achievements.user = ctx.accounts.user.key();
    achievements.unlocked = 0;
    achievements.rank = 0;
    achievements.points = 0;
    achievements.first_deposit_time = clock.unix_timestamp;
    achievements.midnight_harvest_count = 0;
    achievements.highest_compound = 0;
    achievements.total_compounds = 0;
    achievements.bump = ctx.bumps.achievements;
    
    msg!("🏆 Achievement tracking initialized for {}", ctx.accounts.user.key());
    msg!("👻 Starting rank: Ghost (0 points)");
    
    Ok(())
}
