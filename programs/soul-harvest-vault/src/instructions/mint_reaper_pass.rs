use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_spl::token::{Mint, Token, TokenAccount, MintTo, mint_to};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instructions::{
    CreateMetadataAccountV3Cpi,
    CreateMetadataAccountV3CpiAccounts,
    CreateMetadataAccountV3InstructionArgs,
    CreateMasterEditionV3Cpi,
    CreateMasterEditionV3CpiAccounts,
    CreateMasterEditionV3InstructionArgs,
};
use mpl_token_metadata::types::{DataV2, Creator, CollectionDetails};

use crate::state::VaultConfig;
use crate::errors::VaultError;
use crate::constants::*;

/// Mint a new Reaper Pass NFT (authority only)
#[derive(Accounts)]
pub struct MintReaperPass<'info> {
    /// Global configuration account (PDA)
    #[account(
        mut,
        seeds = [VaultConfig::SEED_PREFIX],
        bump = config.bump,
        has_one = authority @ VaultError::Unauthorized,
    )]
    pub config: Account<'info, VaultConfig>,
    
    /// Reaper Pass NFT mint account
    #[account(
        mut,
        address = config.reaper_mint,
    )]
    pub reaper_mint: Account<'info, Mint>,
    
    /// Recipient's token account for the Reaper Pass
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = reaper_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    /// Recipient who will receive the Reaper Pass
    /// CHECK: This account is not read or written, just used as the recipient
    pub recipient: UncheckedAccount<'info>,
    
    /// Program authority (must match config.authority)
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// Metaplex metadata account for the NFT
    /// CHECK: This account will be initialized by Metaplex
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    /// Metaplex master edition account for the NFT
    /// CHECK: This account will be initialized by Metaplex
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    
    /// SPL Token program
    pub token_program: Program<'info, Token>,
    
    /// Associated Token program
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    /// Metaplex Token Metadata program
    /// CHECK: This is the Metaplex Token Metadata program ID
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// Mint Reaper Pass instruction handler
pub fn handler(ctx: Context<MintReaperPass>) -> Result<()> {
    // Verify supply limit has not been reached
    require!(
        ctx.accounts.config.reaper_supply < REAPER_MAX_SUPPLY,
        VaultError::SupplyExhausted
    );
    
    // Get config bump for signing
    let config_bump = ctx.accounts.config.bump;
    let authority_key = ctx.accounts.config.authority;
    
    // Mint 1 token to recipient
    let config_seeds = &[
        VaultConfig::SEED_PREFIX,
        &[config_bump],
    ];
    let signer_seeds = &[&config_seeds[..]];
    
    let cpi_accounts = MintTo {
        mint: ctx.accounts.reaper_mint.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.config.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    
    mint_to(cpi_ctx, 1)?;
    
    // Create Metaplex metadata
    let data_v2 = DataV2 {
        name: REAPER_PASS_NAME.to_string(),
        symbol: REAPER_PASS_SYMBOL.to_string(),
        uri: REAPER_PASS_URI.to_string(),
        seller_fee_basis_points: 0,
        creators: Some(vec![Creator {
            address: authority_key,
            verified: false,
            share: 100,
        }]),
        collection: None,
        uses: None,
    };
    
    // Store account infos to avoid temporary value issues
    let metadata_info = ctx.accounts.metadata.to_account_info();
    let mint_info = ctx.accounts.reaper_mint.to_account_info();
    let config_info = ctx.accounts.config.to_account_info();
    let authority_info = ctx.accounts.authority.to_account_info();
    let system_program_info = ctx.accounts.system_program.to_account_info();
    let rent_info = ctx.accounts.rent.to_account_info();
    
    let create_metadata_accounts = CreateMetadataAccountV3CpiAccounts {
        metadata: &metadata_info,
        mint: &mint_info,
        mint_authority: &config_info,
        payer: &authority_info,
        update_authority: (&config_info, true),
        system_program: &system_program_info,
        rent: Some(&rent_info),
    };
    
    let create_metadata_args = CreateMetadataAccountV3InstructionArgs {
        data: data_v2,
        is_mutable: true,
        collection_details: None,
    };
    
    CreateMetadataAccountV3Cpi::new(
        &ctx.accounts.token_metadata_program.to_account_info(),
        create_metadata_accounts,
        create_metadata_args,
    )
    .invoke_signed(signer_seeds)?;
    
    // Create master edition (supply = 1 for NFT)
    let edition_info = ctx.accounts.master_edition.to_account_info();
    let metadata_info2 = ctx.accounts.metadata.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();
    
    let create_master_edition_accounts = CreateMasterEditionV3CpiAccounts {
        edition: &edition_info,
        mint: &mint_info,
        update_authority: &config_info,
        mint_authority: &config_info,
        payer: &authority_info,
        metadata: &metadata_info2,
        token_program: &token_program_info,
        system_program: &system_program_info,
        rent: Some(&rent_info),
    };
    
    let create_master_edition_args = CreateMasterEditionV3InstructionArgs {
        max_supply: Some(0), // 0 means unlimited prints, but we control via reaper_supply
    };
    
    CreateMasterEditionV3Cpi::new(
        &ctx.accounts.token_metadata_program.to_account_info(),
        create_master_edition_accounts,
        create_master_edition_args,
    )
    .invoke_signed(signer_seeds)?;
    
    // Increment supply counter
    let config = &mut ctx.accounts.config;
    config.reaper_supply = config.reaper_supply
        .checked_add(1)
        .ok_or(VaultError::ArithmeticOverflow)?;
    
    msg!("Reaper Pass minted successfully");
    msg!("Recipient: {}", ctx.accounts.recipient.key());
    msg!("Current supply: {}/{}", config.reaper_supply, REAPER_MAX_SUPPLY);
    
    Ok(())
}
