use anchor_lang::prelude::*;
use crate::state::leaderboard::LeaderboardEntry;

/// Query and rank all leaderboard entries
/// This is a view-only function that fetches all leaderboard entries,
/// sorts them by TVL in descending order, and assigns ranks
pub fn query_leaderboard(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> Result<Vec<LeaderboardEntryRanked>> {
    let mut entries: Vec<LeaderboardEntryRanked> = Vec::new();

    // Iterate through all accounts and filter for LeaderboardEntry accounts
    for account_info in accounts.iter() {
        // Check if account is owned by our program
        if account_info.owner != program_id {
            continue;
        }

        // Try to deserialize as LeaderboardEntry
        if let Ok(entry) = LeaderboardEntry::try_deserialize(&mut &account_info.data.borrow()[..]) {
            entries.push(LeaderboardEntryRanked {
                user: entry.user,
                tvl: entry.tvl,
                rank: 0, // Will be assigned after sorting
                bump: entry.bump,
            });
        }
    }

    // Sort entries by TVL in descending order (highest TVL first)
    entries.sort_by(|a, b| b.tvl.cmp(&a.tvl));

    // Assign ranks based on sorted position (0-indexed, 0 = highest)
    for (index, entry) in entries.iter_mut().enumerate() {
        entry.rank = index as u32;
    }

    Ok(entries)
}

/// Ranked leaderboard entry for query results
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct LeaderboardEntryRanked {
    pub user: Pubkey,
    pub tvl: u64,
    pub rank: u32,
    pub bump: u8,
}
