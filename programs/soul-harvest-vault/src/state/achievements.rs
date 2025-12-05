//! Achievement system for Soul Harvest Vault
//!
//! Tracks user achievements and ranks based on their vault activity.
//! Achievements are unlocked automatically when conditions are met.

use anchor_lang::prelude::*;

/// Achievement flags stored as a bitfield for efficient storage
/// Each bit represents whether an achievement is unlocked
#[account]
pub struct UserAchievements {
    /// User who owns these achievements
    pub user: Pubkey,
    
    /// Bitfield of unlocked achievements (supports up to 64 achievements)
    pub unlocked: u64,
    
    /// Current rank tier (0-4)
    pub rank: u8,
    
    /// Total achievement points earned
    pub points: u32,
    
    /// Timestamp of first deposit (for "OG" achievements)
    pub first_deposit_time: i64,
    
    /// Count of midnight harvests participated in
    pub midnight_harvest_count: u32,
    
    /// Highest single compound reward earned
    pub highest_compound: u64,
    
    /// Total number of compounds performed
    pub total_compounds: u32,
    
    /// PDA bump seed
    pub bump: u8,
}

impl UserAchievements {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 4 + 8 + 4 + 8 + 4 + 1;
    pub const SEED_PREFIX: &'static [u8] = b"achievements";
}

/// Achievement definitions with their bit positions and requirements
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Achievement {
    // === Deposit Achievements ===
    /// First Blood - Make your first deposit
    FirstBlood = 0,
    /// Soul Starter - Deposit 1,000 tokens
    SoulStarter = 1,
    /// Grave Digger - Deposit 10,000 tokens
    GraveDigger = 2,
    /// Crypt Keeper - Deposit 100,000 tokens
    CryptKeeper = 3,
    /// Necromancer - Deposit 1,000,000 tokens
    Necromancer = 4,
    
    // === Soul Harvesting Achievements ===
    /// Soul Collector - Harvest 100 souls
    SoulCollector = 5,
    /// Soul Reaper - Harvest 1,000 souls
    SoulReaper = 6,
    /// Soul Master - Harvest 10,000 souls
    SoulMaster = 7,
    /// Death Lord - Harvest 100,000 souls
    DeathLord = 8,
    /// Grim Reaper - Harvest 1,000,000 souls
    GrimReaper = 9,
    
    // === Compound Achievements ===
    /// Night Owl - Compound at midnight (00:00-01:00 UTC)
    NightOwl = 10,
    /// Early Bird - Compound at dawn (05:00-06:00 UTC)
    EarlyBird = 11,
    /// Compound King - Perform 10 compounds
    CompoundKing = 12,
    /// Yield Farmer - Perform 100 compounds
    YieldFarmer = 13,
    /// DeFi Degen - Perform 1,000 compounds
    DefiDegen = 14,
    
    // === Midnight Harvest Achievements ===
    /// Witching Hour - Participate in 1 midnight harvest
    WitchingHour = 15,
    /// Haunted - Participate in 7 midnight harvests (1 week)
    Haunted = 16,
    /// Possessed - Participate in 30 midnight harvests (1 month)
    Possessed = 17,
    /// Eternal - Participate in 365 midnight harvests (1 year)
    Eternal = 18,
    
    // === Special Achievements ===
    /// Reaper's Chosen - Hold a Reaper Pass NFT
    ReapersChosen = 19,
    /// Diamond Hands - Hold for 30 days without withdrawing
    DiamondHands = 20,
    /// OG Soul - Among first 100 depositors
    OgSoul = 21,
    /// Whale - Have 1M+ tokens in vault
    Whale = 22,
    /// Charity Champion - Donate 10,000+ to charity via midnight harvest
    CharityChampion = 23,
    
    // === Streak Achievements ===
    /// Hot Streak - Compound 7 days in a row
    HotStreak = 24,
    /// On Fire - Compound 30 days in a row
    OnFire = 25,
    /// Unstoppable - Compound 100 days in a row
    Unstoppable = 26,
}

impl Achievement {
    /// Get the point value for this achievement
    pub fn points(&self) -> u32 {
        match self {
            // Deposit achievements: 10-100 points
            Achievement::FirstBlood => 10,
            Achievement::SoulStarter => 20,
            Achievement::GraveDigger => 40,
            Achievement::CryptKeeper => 70,
            Achievement::Necromancer => 100,
            
            // Soul harvesting: 15-150 points
            Achievement::SoulCollector => 15,
            Achievement::SoulReaper => 30,
            Achievement::SoulMaster => 60,
            Achievement::DeathLord => 100,
            Achievement::GrimReaper => 150,
            
            // Compound achievements: 10-50 points
            Achievement::NightOwl => 25,
            Achievement::EarlyBird => 25,
            Achievement::CompoundKing => 20,
            Achievement::YieldFarmer => 35,
            Achievement::DefiDegen => 50,
            
            // Midnight harvest: 20-200 points
            Achievement::WitchingHour => 20,
            Achievement::Haunted => 40,
            Achievement::Possessed => 80,
            Achievement::Eternal => 200,
            
            // Special achievements: 50-100 points
            Achievement::ReapersChosen => 100,
            Achievement::DiamondHands => 75,
            Achievement::OgSoul => 100,
            Achievement::Whale => 80,
            Achievement::CharityChampion => 60,
            
            // Streak achievements: 30-100 points
            Achievement::HotStreak => 30,
            Achievement::OnFire => 60,
            Achievement::Unstoppable => 100,
        }
    }
    
    /// Get the display name for this achievement
    pub fn name(&self) -> &'static str {
        match self {
            Achievement::FirstBlood => "First Blood",
            Achievement::SoulStarter => "Soul Starter",
            Achievement::GraveDigger => "Grave Digger",
            Achievement::CryptKeeper => "Crypt Keeper",
            Achievement::Necromancer => "Necromancer",
            Achievement::SoulCollector => "Soul Collector",
            Achievement::SoulReaper => "Soul Reaper",
            Achievement::SoulMaster => "Soul Master",
            Achievement::DeathLord => "Death Lord",
            Achievement::GrimReaper => "Grim Reaper",
            Achievement::NightOwl => "Night Owl",
            Achievement::EarlyBird => "Early Bird",
            Achievement::CompoundKing => "Compound King",
            Achievement::YieldFarmer => "Yield Farmer",
            Achievement::DefiDegen => "DeFi Degen",
            Achievement::WitchingHour => "Witching Hour",
            Achievement::Haunted => "Haunted",
            Achievement::Possessed => "Possessed",
            Achievement::Eternal => "Eternal",
            Achievement::ReapersChosen => "Reaper's Chosen",
            Achievement::DiamondHands => "Diamond Hands",
            Achievement::OgSoul => "OG Soul",
            Achievement::Whale => "Whale",
            Achievement::CharityChampion => "Charity Champion",
            Achievement::HotStreak => "Hot Streak",
            Achievement::OnFire => "On Fire",
            Achievement::Unstoppable => "Unstoppable",
        }
    }
}

/// Rank tiers based on total achievement points
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Rank {
    /// 0-99 points
    Ghost = 0,
    /// 100-299 points
    Specter = 1,
    /// 300-599 points
    Wraith = 2,
    /// 600-999 points
    Phantom = 3,
    /// 1000+ points
    Reaper = 4,
}

impl Rank {
    pub fn from_points(points: u32) -> Self {
        if points >= 1000 {
            Rank::Reaper
        } else if points >= 600 {
            Rank::Phantom
        } else if points >= 300 {
            Rank::Wraith
        } else if points >= 100 {
            Rank::Specter
        } else {
            Rank::Ghost
        }
    }
    
    pub fn name(&self) -> &'static str {
        match self {
            Rank::Ghost => "Ghost",
            Rank::Specter => "Specter",
            Rank::Wraith => "Wraith",
            Rank::Phantom => "Phantom",
            Rank::Reaper => "Reaper",
        }
    }
    
    /// Bonus multiplier in basis points (e.g., 10100 = 1.01x = 1% bonus)
    pub fn bonus_bps(&self) -> u16 {
        match self {
            Rank::Ghost => 10000,    // 1.00x (no bonus)
            Rank::Specter => 10100,  // 1.01x (1% bonus)
            Rank::Wraith => 10250,   // 1.025x (2.5% bonus)
            Rank::Phantom => 10500,  // 1.05x (5% bonus)
            Rank::Reaper => 11000,   // 1.10x (10% bonus)
        }
    }
}

impl UserAchievements {
    /// Check if an achievement is unlocked
    pub fn has_achievement(&self, achievement: Achievement) -> bool {
        let bit = 1u64 << (achievement as u8);
        self.unlocked & bit != 0
    }
    
    /// Unlock an achievement and return points earned (0 if already unlocked)
    pub fn unlock(&mut self, achievement: Achievement) -> u32 {
        let bit = 1u64 << (achievement as u8);
        if self.unlocked & bit != 0 {
            return 0; // Already unlocked
        }
        
        self.unlocked |= bit;
        let points = achievement.points();
        self.points = self.points.saturating_add(points);
        self.rank = Rank::from_points(self.points) as u8;
        
        points
    }
    
    /// Get current rank
    pub fn get_rank(&self) -> Rank {
        Rank::from_points(self.points)
    }
    
    /// Count total unlocked achievements
    pub fn count_unlocked(&self) -> u32 {
        self.unlocked.count_ones()
    }
}
