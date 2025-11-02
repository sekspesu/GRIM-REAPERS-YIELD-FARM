use anchor_lang::prelude::*;

/// Leaderboard entry tracking user's total value locked and rank
#[account]
pub struct LeaderboardEntry {
    /// User's public key
    pub user: Pubkey,
    
    /// Total value locked across all user's vaults
    pub tvl: u64,
    
    /// Current rank on the leaderboard (0-indexed, 0 = highest)
    pub rank: u32,
    
    /// PDA bump seed
    pub bump: u8,
}

impl LeaderboardEntry {
    /// Calculate the space required for the LeaderboardEntry account
    /// 8 (discriminator) + 32 (user) + 8 (tvl) + 4 (rank) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 8 + 4 + 1;
    
    /// PDA seed prefix for leaderboard entries
    pub const SEED_PREFIX: &'static [u8] = b"leaderboard";
}
