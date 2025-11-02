//! Custom error types for the Soul Harvest Vault program
//!
//! This module defines all custom errors that can be returned by the program.
//! Each error has a unique code (starting at 6000) and a descriptive message.

use anchor_lang::prelude::*;

/// Custom error codes for the Soul Harvest Vault program
///
/// Error codes start at 6000 (Anchor convention for custom errors).
#[error_code]
pub enum VaultError {
    /// Error 6000: User doesn't have enough tokens for the operation
    ///
    /// Returned when attempting to create a vault with more tokens than
    /// the user has in their token account.
    ///
    /// **Common causes**:
    /// - Insufficient token balance in user's wallet
    /// - Token account not initialized
    ///
    /// **Resolution**: Ensure user has sufficient tokens before calling create_vault
    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
    
    /// Error 6001: Withdrawal amount exceeds vault balance
    ///
    /// Returned when attempting to withdraw more tokens than are currently
    /// in the vault.
    ///
    /// **Common causes**:
    /// - Requesting withdrawal of more than vault.balance
    /// - Vault balance was reduced by another transaction
    ///
    /// **Resolution**: Check vault.balance and withdraw a valid amount
    #[msg("Insufficient balance in vault")]
    InsufficientBalance,
    
    /// Error 6002: Cannot close vault with non-zero balance
    ///
    /// Returned when attempting to close a vault that still has tokens in it.
    /// All tokens must be withdrawn before closing.
    ///
    /// **Common causes**:
    /// - Attempting to close vault without withdrawing all funds
    /// - Vault received tokens after last withdrawal
    ///
    /// **Resolution**: Withdraw all tokens (vault.balance must be 0) before closing
    #[msg("Vault balance must be zero to close")]
    NonZeroBalance,
    
    /// Error 6003: Vault is not active
    ///
    /// Returned when attempting to compound rewards on an inactive vault.
    /// Vaults become inactive when closed.
    ///
    /// **Common causes**:
    /// - Vault was closed (is_active = false)
    /// - Attempting to compound on a closed vault
    ///
    /// **Resolution**: Only active vaults can compound. Withdrawals are still allowed.
    #[msg("Vault is not active")]
    VaultInactive,
    
    /// Error 6004: Reaper Pass supply limit reached
    ///
    /// Returned when attempting to mint a Reaper Pass after the maximum
    /// supply of 1666 has been reached.
    ///
    /// **Common causes**:
    /// - All 1666 Reaper Passes have been minted
    ///
    /// **Resolution**: No more Reaper Passes can be minted
    #[msg("Reaper Pass supply exhausted")]
    SupplyExhausted,
    
    /// Error 6005: Unauthorized action
    ///
    /// Returned when a non-authority account attempts to perform an
    /// authority-only action (e.g., minting Reaper Passes).
    ///
    /// **Common causes**:
    /// - Non-authority trying to mint Reaper Pass
    /// - Wrong signer for protected operation
    ///
    /// **Resolution**: Ensure the correct authority account is signing
    #[msg("Unauthorized: only authority can perform this action")]
    Unauthorized,
    
    /// Error 6006: Invalid token mint
    ///
    /// Returned when a token account's mint doesn't match the expected mint.
    ///
    /// **Common causes**:
    /// - Wrong token account provided
    /// - Token account for different mint
    /// - Reaper Pass token account for wrong mint
    ///
    /// **Resolution**: Provide token accounts with the correct mint address
    #[msg("Invalid token mint")]
    InvalidMint,
    
    /// Error 6007: Arithmetic overflow
    ///
    /// Returned when a calculation would result in integer overflow.
    /// All arithmetic operations use checked math to prevent this.
    ///
    /// **Common causes**:
    /// - Extremely large balances or time periods
    /// - Calculation result exceeds u64::MAX
    ///
    /// **Resolution**: This should be rare; contact support if encountered
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    /// Error 6008: Invalid deposit amount
    ///
    /// Returned when attempting to create a vault with a deposit of zero.
    ///
    /// **Common causes**:
    /// - initial_deposit parameter is 0
    /// - Negative or invalid amount
    ///
    /// **Resolution**: Provide a deposit amount greater than zero
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
}
