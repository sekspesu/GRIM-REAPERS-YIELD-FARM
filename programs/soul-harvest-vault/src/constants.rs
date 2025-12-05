//! Program constants for Soul Harvest Vault
//!
//! This module contains all constant values used throughout the program,
//! including PDA seeds, time calculations, and default configuration values.

/// Maximum supply of Reaper Pass NFTs
///
/// This is a hard cap enforced by the program. Once 1666 Reaper Passes
/// have been minted, no more can be created.
pub const REAPER_MAX_SUPPLY: u16 = 1666;

// ============================================================================
// PDA Seed Constants
// ============================================================================

/// PDA seed for the global VaultConfig account
///
/// Used to derive: `["config"]`
pub const CONFIG_SEED: &[u8] = b"config";

/// PDA seed prefix for Vault accounts
///
/// Used to derive: `["vault", owner, token_mint]`
pub const VAULT_SEED: &[u8] = b"vault";

/// PDA seed prefix for LeaderboardEntry accounts
///
/// Used to derive: `["leaderboard", user]`
pub const LEADERBOARD_SEED: &[u8] = b"leaderboard";

/// PDA seed prefix for UserAchievements accounts
///
/// Used to derive: `["achievements", user]`
pub const ACHIEVEMENTS_SEED: &[u8] = b"achievements";

// ============================================================================
// Time Constants (in seconds)
// ============================================================================

/// Number of seconds in one minute
pub const SECONDS_PER_MINUTE: i64 = 60;

/// Number of seconds in one hour (60 minutes)
pub const SECONDS_PER_HOUR: i64 = 60 * SECONDS_PER_MINUTE;

/// Number of seconds in one day (24 hours)
pub const SECONDS_PER_DAY: i64 = 24 * SECONDS_PER_HOUR;

/// Number of seconds in one year (365 days)
///
/// Used in APY calculations. Does not account for leap years.
pub const SECONDS_PER_YEAR: i64 = 365 * SECONDS_PER_DAY;

// ============================================================================
// Calculation Constants
// ============================================================================

/// Basis points divisor (10000 = 100%)
///
/// Used to represent percentages with precision:
/// - 1 basis point = 0.01%
/// - 100 basis points = 1%
/// - 10000 basis points = 100%
///
/// Example: 1000 basis points = 10%
pub const BASIS_POINTS: u64 = 10_000;

/// Legacy alias for BASIS_POINTS
pub const BASIS_POINTS_DIVISOR: u64 = BASIS_POINTS;

// ============================================================================
// Midnight Harvest Constants
// ============================================================================

/// Soul tax rate in basis points (1300 = 13%)
///
/// This percentage of rewards is burned during midnight harvest
pub const SOUL_TAX_BPS: u64 = 1_300;

/// Charity donation rate in basis points (100 = 1%)
///
/// This percentage of rewards is sent to Solana Foundation
pub const CHARITY_BPS: u64 = 100;

// ============================================================================
// Default Configuration Values
// ============================================================================

/// Default base APY in basis points (1000 = 10%)
///
/// This is the annual percentage yield applied to vault balances
/// when calculating compound rewards.
pub const DEFAULT_BASE_APY: u16 = 1000;

/// Default Reaper Pass boost multiplier in basis points (20000 = 2.0x)
///
/// Reaper Pass holders receive this multiplier on their rewards.
/// 20000 basis points = 2.0x = 200% of base rewards.
pub const DEFAULT_REAPER_BOOST: u16 = 20_000;

/// Default number of souls earned per token compounded
///
/// For every token earned through compounding, this many souls
/// are added to the vault's total_souls_harvested.
pub const DEFAULT_SOULS_PER_TOKEN: u64 = 1;

// ============================================================================
// Metaplex Metadata Constants
// ============================================================================

/// Name for Reaper Pass NFTs
///
/// This appears as the NFT name in wallets and marketplaces.
pub const REAPER_PASS_NAME: &str = "Kiroween Reaper Pass";

/// Symbol for Reaper Pass NFTs
///
/// This appears as the NFT symbol/ticker.
pub const REAPER_PASS_SYMBOL: &str = "REAPER";

/// URI for Reaper Pass NFT metadata
///
/// This should point to a JSON file containing the NFT metadata
/// following the Metaplex standard.
pub const REAPER_PASS_URI: &str = "https://arweave.net/halloween-reaper.json";
