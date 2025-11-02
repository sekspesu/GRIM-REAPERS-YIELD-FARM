/**
 * Midnight Harvest Script
 * 
 * This script executes the midnight harvest operation for all active vaults.
 * It should be run daily at 00:00 UTC via a cron job or scheduler.
 * 
 * Usage:
 *   ts-node scripts/midnight-harvest.ts
 * 
 * Environment Variables:
 *   - ANCHOR_WALLET: Path to wallet keypair
 *   - ANCHOR_PROVIDER_URL: Solana RPC endpoint
 *   - CHARITY_WALLET: Solana Foundation wallet address
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoulHarvestVault } from "../target/types/soul_harvest_vault";
import { PublicKey, Connection } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

// Solana Foundation wallet (replace with actual address)
const SOLANA_FOUNDATION_WALLET = new PublicKey("SoLFdqjXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");

interface VaultAccount {
  publicKey: PublicKey;
  account: any;
}

async function getAllActiveVaults(
  program: Program<SoulHarvestVault>
): Promise<VaultAccount[]> {
  const vaults = await program.account.vault.all([
    {
      memcmp: {
        offset: 8 + 32 + 32 + 8 + 8 + 8, // Skip to is_active field
        bytes: anchor.utils.bytes.bs58.encode(Buffer.from([1])), // is_active = true
      },
    },
  ]);

  return vaults;
}

async function executeMidnightHarvest(
  program: Program<SoulHarvestVault>,
  vault: VaultAccount,
  configPda: PublicKey,
  reaperMint: PublicKey,
  charityWallet: PublicKey
): Promise<void> {
  try {
    const owner = vault.account.owner;
    const tokenMint = vault.account.tokenMint;

    // Get owner's Reaper Pass token account (if exists)
    let ownerReaperAccount: PublicKey | null = null;
    try {
      ownerReaperAccount = await getAssociatedTokenAddress(reaperMint, owner);
      const accountInfo = await program.provider.connection.getAccountInfo(ownerReaperAccount);
      if (!accountInfo) {
        ownerReaperAccount = null;
      }
    } catch (e) {
      ownerReaperAccount = null;
    }

    // Get vault token account
    const vaultTokenAccount = await getAssociatedTokenAddress(tokenMint, vault.publicKey, true);

    // Get charity token account
    const charityTokenAccount = await getAssociatedTokenAddress(tokenMint, charityWallet);

    // Build instruction accounts
    const accounts: any = {
      vault: vault.publicKey,
      config: configPda,
      reaperMint,
      charityWallet,
      vaultTokenAccount,
      charityTokenAccount,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    };

    // Add optional Reaper Pass account if owner has one
    if (ownerReaperAccount) {
      accounts.ownerReaperAccount = ownerReaperAccount;
    }

    // Execute midnight harvest
    const result = await program.methods
      .midnightHarvest()
      .accounts(accounts)
      .rpc();

    console.log(`✅ Harvested vault ${vault.publicKey.toBase58()}`);
    console.log(`   Owner: ${owner.toBase58()}`);
    console.log(`   Signature: ${result}`);
  } catch (error) {
    console.error(`❌ Failed to harvest vault ${vault.publicKey.toBase58()}:`, error);
  }
}

async function main() {
  // Setup Anchor provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;

  console.log("🌙 Starting Midnight Harvest...");
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Program: ${program.programId.toBase58()}`);

  // Get config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  // Fetch config to get reaper mint
  const config = await program.account.vaultConfig.fetch(configPda);
  const reaperMint = config.reaperMint;

  console.log(`   Config: ${configPda.toBase58()}`);
  console.log(`   Reaper Mint: ${reaperMint.toBase58()}`);

  // Get all active vaults
  const vaults = await getAllActiveVaults(program);
  console.log(`\n📊 Found ${vaults.length} active vaults`);

  if (vaults.length === 0) {
    console.log("   No vaults to harvest. Exiting.");
    return;
  }

  // Execute harvest for each vault
  let successCount = 0;
  let failCount = 0;

  for (const vault of vaults) {
    try {
      await executeMidnightHarvest(
        program,
        vault,
        configPda,
        reaperMint,
        SOLANA_FOUNDATION_WALLET
      );
      successCount++;
    } catch (error) {
      failCount++;
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n🎃 Midnight Harvest Complete!");
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Total: ${vaults.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
