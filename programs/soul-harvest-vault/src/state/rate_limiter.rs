use anchor_lang::prelude::*;

/// Rate limiter for preventing spam attacks
/// Tracks transaction timestamps per user to enforce rate limits
#[account]
pub struct RateLimiter {
    /// User being rate limited
    pub user: Pubkey,
    
    /// Circular buffer of recent transaction timestamps (last 100)
    pub recent_timestamps: [i64; 100],
    
    /// Current write position in circular buffer
    pub write_index: u8,
    
    /// Number of transactions in current window
    pub tx_count: u8,
    
    /// PDA bump seed
    pub bump: u8,
}

impl RateLimiter {
    /// Calculate the space required for the RateLimiter account
    /// 8 (discriminator) + 32 (user) + 800 (timestamps) + 1 (write_index) + 1 (tx_count) + 1 (bump)
    pub const LEN: usize = 8 + 32 + 800 + 1 + 1 + 1;
    
    /// PDA seed prefix for rate limiter accounts
    pub const SEED_PREFIX: &'static [u8] = b"rate_limiter";
    
    /// Maximum transactions per second per user
    pub const MAX_TPS_PER_USER: u8 = 100;
    
    /// Time window for rate limiting (1 second in Unix timestamp)
    pub const RATE_WINDOW_SECONDS: i64 = 1;
    
    /// Check if user can perform transaction (rate limit check)
    pub fn can_transact(&self, current_time: i64) -> bool {
        // Count transactions in the last second
        let mut count = 0;
        for timestamp in self.recent_timestamps.iter() {
            if *timestamp > 0 && current_time - *timestamp < Self::RATE_WINDOW_SECONDS {
                count += 1;
            }
        }
        
        count < Self::MAX_TPS_PER_USER
    }
    
    /// Record a new transaction timestamp
    pub fn record_transaction(&mut self, current_time: i64) {
        self.recent_timestamps[self.write_index as usize] = current_time;
        self.write_index = (self.write_index + 1) % 100;
        
        // Update transaction count
        let mut count = 0;
        for timestamp in self.recent_timestamps.iter() {
            if *timestamp > 0 && current_time - *timestamp < Self::RATE_WINDOW_SECONDS {
                count += 1;
            }
        }
        self.tx_count = count;
    }
}
