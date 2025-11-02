use anchor_lang::prelude::*;

/// Individual user vault for token staking and soul harvesting
#[account]
pub struct Vault {
    /// Owner of the vault
    pub owner: Pubkey,
    
    /// Token mint being staked in this vault
    pub token_mint: Pubkey,
    
    /// Current token balance in the vault
    pub balance: u64,
    
    /// Timestamp of last compound operation (Unix timestamp)
    pub last_compound: i64,
    
    /// Cumulative souls harvested by this vault
    pub total_souls_harvested: u64,
    
    /// Whether the vault is active (false when closed)
    pub is_active: bool,
    
    /// PDA bump seed
    pub bump: u8,
}

impl Vault {
    /// Calculate the space required for the Vault account
    /// 8 (discriminator) + 32 (owner) + 32 (token_mint) + 8 (balance) 
    /// + 8 (last_compound) + 8 (total_souls_harvested) + 1 (is_active) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1;
    
    /// PDA seed prefix for vault accounts
    pub const SEED_PREFIX: &'static [u8] = b"vault";
}
