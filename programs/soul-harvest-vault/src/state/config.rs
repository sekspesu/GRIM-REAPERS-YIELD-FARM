use anchor_lang::prelude::*;

/// Global configuration for the Soul Harvest Vault program
#[account]
pub struct VaultConfig {
    /// Program authority that can mint Reaper Passes
    pub authority: Pubkey,
    
    /// Mint address for Reaper Pass NFTs
    pub reaper_mint: Pubkey,
    
    /// Current number of Reaper Passes minted (max 1666)
    pub reaper_supply: u16,
    
    /// Base APY in basis points (e.g., 1000 = 10%)
    pub base_apy: u16,
    
    /// Boost multiplier for Reaper Pass holders in basis points (e.g., 20000 = 2.0x)
    pub reaper_boost: u16,
    
    /// Number of souls earned per token compounded
    pub souls_per_token: u64,
    
    /// Total value locked across all vaults (in lamports/tokens)
    pub total_tvl: u64,
    
    /// PDA bump seed
    pub bump: u8,
}

impl VaultConfig {
    /// Calculate the space required for the VaultConfig account
    /// 8 (discriminator) + 32 (authority) + 32 (reaper_mint) + 2 (reaper_supply) 
    /// + 2 (base_apy) + 2 (reaper_boost) + 8 (souls_per_token) + 8 (total_tvl) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 32 + 2 + 2 + 2 + 8 + 8 + 1;
    
    /// PDA seed prefix for config account
    pub const SEED_PREFIX: &'static [u8] = b"config";
    
    /// Calculate dynamic APY based on total TVL
    /// 
    /// Fear Index APY Tiers:
    /// - TVL >= 100,000 SOL => 15.0% APY
    /// - TVL >= 50,000 SOL => 12.0% APY
    /// - TVL >= 10,000 SOL => 8.0% APY
    /// - TVL < 10,000 SOL => 5.0% APY
    /// 
    /// Returns APY in basis points (e.g., 1500 = 15%)
    pub fn calculate_dynamic_apy(&self) -> u16 {
        const SOL_LAMPORTS: u64 = 1_000_000_000; // 1 SOL = 1 billion lamports
        
        let tvl_in_sol = self.total_tvl / SOL_LAMPORTS;
        
        if tvl_in_sol >= 100_000 {
            1500 // 15.0% APY
        } else if tvl_in_sol >= 50_000 {
            1200 // 12.0% APY
        } else if tvl_in_sol >= 10_000 {
            800 // 8.0% APY
        } else {
            500 // 5.0% APY
        }
    }
}
