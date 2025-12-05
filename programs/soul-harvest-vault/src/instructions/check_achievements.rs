//! Check and unlock achievements based on current vault state
//!
//! This instruction checks all achievement conditions and unlocks any
//! that the user has earned but not yet claimed.

use anchor_lang::prelude::*;
use crate::state::{UserAchievements, Achievement, Vault, VaultConfig};

#[derive(Accounts)]
pub struct CheckAchievements<'info> {
    #[account(
        mut,
        seeds = [UserAchievements::SEED_PREFIX, user.key().as_ref()],
        bump = achievements.bump
    )]
    pub achievements: Account<'info, UserAchievements>,
    
    #[account(
        seeds = [Vault::SEED_PREFIX, user.key().as_ref(), vault.token_mint.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        seeds = [VaultConfig::SEED_PREFIX],
        bump = config.bump
    )]
    pub config: Account<'info, VaultConfig>,
    
    pub user: Signer<'info>,
}

/// Result of checking achievements
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AchievementCheckResult {
    pub newly_unlocked: Vec<String>,
    pub points_earned: u32,
    pub new_rank: String,
    pub total_points: u32,
}

pub fn handler(ctx: Context<CheckAchievements>) -> Result<AchievementCheckResult> {
    let achievements = &mut ctx.accounts.achievements;
    let vault = &ctx.accounts.vault;
    let clock = Clock::get()?;
    
    let mut newly_unlocked: Vec<String> = Vec::new();
    let mut points_earned: u32 = 0;
    
    // === Check Deposit Achievements ===
    if vault.balance > 0 {
        let pts = achievements.unlock(Achievement::FirstBlood);
        if pts > 0 {
            newly_unlocked.push("First Blood 🩸".to_string());
            points_earned += pts;
        }
    }
    
    if vault.balance >= 1_000 {
        let pts = achievements.unlock(Achievement::SoulStarter);
        if pts > 0 {
            newly_unlocked.push("Soul Starter 👻".to_string());
            points_earned += pts;
        }
    }
    
    if vault.balance >= 10_000 {
        let pts = achievements.unlock(Achievement::GraveDigger);
        if pts > 0 {
            newly_unlocked.push("Grave Digger ⚰️".to_string());
            points_earned += pts;
        }
    }
    
    if vault.balance >= 100_000 {
        let pts = achievements.unlock(Achievement::CryptKeeper);
        if pts > 0 {
            newly_unlocked.push("Crypt Keeper 🪦".to_string());
            points_earned += pts;
        }
    }
    
    if vault.balance >= 1_000_000 {
        let pts = achievements.unlock(Achievement::Necromancer);
        if pts > 0 {
            newly_unlocked.push("Necromancer 💀".to_string());
            points_earned += pts;
        }
        
        // Also unlock Whale
        let pts = achievements.unlock(Achievement::Whale);
        if pts > 0 {
            newly_unlocked.push("Whale 🐋".to_string());
            points_earned += pts;
        }
    }
    
    // === Check Soul Harvesting Achievements ===
    let souls = vault.total_souls_harvested;
    
    if souls >= 100 {
        let pts = achievements.unlock(Achievement::SoulCollector);
        if pts > 0 {
            newly_unlocked.push("Soul Collector 👤".to_string());
            points_earned += pts;
        }
    }
    
    if souls >= 1_000 {
        let pts = achievements.unlock(Achievement::SoulReaper);
        if pts > 0 {
            newly_unlocked.push("Soul Reaper ⚔️".to_string());
            points_earned += pts;
        }
    }
    
    if souls >= 10_000 {
        let pts = achievements.unlock(Achievement::SoulMaster);
        if pts > 0 {
            newly_unlocked.push("Soul Master 🎭".to_string());
            points_earned += pts;
        }
    }
    
    if souls >= 100_000 {
        let pts = achievements.unlock(Achievement::DeathLord);
        if pts > 0 {
            newly_unlocked.push("Death Lord 👑".to_string());
            points_earned += pts;
        }
    }
    
    if souls >= 1_000_000 {
        let pts = achievements.unlock(Achievement::GrimReaper);
        if pts > 0 {
            newly_unlocked.push("Grim Reaper 💀".to_string());
            points_earned += pts;
        }
    }
    
    // === Check Compound Achievements ===
    let compounds = achievements.total_compounds;
    
    if compounds >= 10 {
        let pts = achievements.unlock(Achievement::CompoundKing);
        if pts > 0 {
            newly_unlocked.push("Compound King 👑".to_string());
            points_earned += pts;
        }
    }
    
    if compounds >= 100 {
        let pts = achievements.unlock(Achievement::YieldFarmer);
        if pts > 0 {
            newly_unlocked.push("Yield Farmer 🌾".to_string());
            points_earned += pts;
        }
    }
    
    if compounds >= 1_000 {
        let pts = achievements.unlock(Achievement::DefiDegen);
        if pts > 0 {
            newly_unlocked.push("DeFi Degen 🎰".to_string());
            points_earned += pts;
        }
    }
    
    // === Check Midnight Harvest Achievements ===
    let harvests = achievements.midnight_harvest_count;
    
    if harvests >= 1 {
        let pts = achievements.unlock(Achievement::WitchingHour);
        if pts > 0 {
            newly_unlocked.push("Witching Hour 🌙".to_string());
            points_earned += pts;
        }
    }
    
    if harvests >= 7 {
        let pts = achievements.unlock(Achievement::Haunted);
        if pts > 0 {
            newly_unlocked.push("Haunted 👻".to_string());
            points_earned += pts;
        }
    }
    
    if harvests >= 30 {
        let pts = achievements.unlock(Achievement::Possessed);
        if pts > 0 {
            newly_unlocked.push("Possessed 😈".to_string());
            points_earned += pts;
        }
    }
    
    if harvests >= 365 {
        let pts = achievements.unlock(Achievement::Eternal);
        if pts > 0 {
            newly_unlocked.push("Eternal ♾️".to_string());
            points_earned += pts;
        }
    }
    
    // === Check Time-Based Achievements ===
    let hour = (clock.unix_timestamp % 86400) / 3600;
    
    // Night Owl: 00:00-01:00 UTC
    if hour == 0 && achievements.total_compounds > 0 {
        let pts = achievements.unlock(Achievement::NightOwl);
        if pts > 0 {
            newly_unlocked.push("Night Owl 🦉".to_string());
            points_earned += pts;
        }
    }
    
    // Early Bird: 05:00-06:00 UTC
    if hour == 5 && achievements.total_compounds > 0 {
        let pts = achievements.unlock(Achievement::EarlyBird);
        if pts > 0 {
            newly_unlocked.push("Early Bird 🐦".to_string());
            points_earned += pts;
        }
    }
    
    // Diamond Hands: 30 days without withdrawing
    let days_held = (clock.unix_timestamp - achievements.first_deposit_time) / 86400;
    if days_held >= 30 && vault.balance > 0 {
        let pts = achievements.unlock(Achievement::DiamondHands);
        if pts > 0 {
            newly_unlocked.push("Diamond Hands 💎".to_string());
            points_earned += pts;
        }
    }
    
    // Log results
    let rank = achievements.get_rank();
    
    if !newly_unlocked.is_empty() {
        msg!("🏆 ACHIEVEMENTS UNLOCKED!");
        for achievement in &newly_unlocked {
            msg!("  ✨ {}", achievement);
        }
        msg!("  📊 Points earned: +{}", points_earned);
        msg!("  🎖️ Current rank: {} ({} points)", rank.name(), achievements.points);
    } else {
        msg!("No new achievements unlocked");
        msg!("🎖️ Current rank: {} ({} points)", rank.name(), achievements.points);
    }
    
    Ok(AchievementCheckResult {
        newly_unlocked,
        points_earned,
        new_rank: rank.name().to_string(),
        total_points: achievements.points,
    })
}
