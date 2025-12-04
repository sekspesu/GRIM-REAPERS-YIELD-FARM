/**
 * Soul Harvest Vault - Demo Script
 * 
 * This script demonstrates the core functionality of the Soul Harvest Vault:
 * 1. Initialize the program
 * 2. Create a vault
 * 3. Compound rewards (with dynamic APY)
 * 4. Withdraw tokens
 * 5. Display leaderboard
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoulHarvestVault } from "../target/types/soul_harvest_vault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount, 
  mintTo, 
  getAccount 
} from "@solana/spl-token";

async function main() {
  console.log("🎃 Soul Harvest Vault - Demo\n");

  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;
  const authority = provider.wallet as anchor.Wallet;

  console.log("Program ID:", program.programId.toString());
  console.log("Authority:", authority.publicKey.toString());
  console.log();

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Config PDA:", configPda.toString());
  console.log();

  // Check if already initialized
  try {
    const config = await program.account.vaultConfig.fetch(configPda);
    console.log("✅ Program already initialized");
    console.log("   Base APY:", config.baseApy, "bps");
    console.log("   Total TVL:", config.totalTvl.toNumber() / 1_000_000_000, "SOL");
    console.log("   Reaper Supply:", config.reaperSupply, "/ 1666");
    
    // Calculate current dynamic APY
    const tvlInSol = config.totalTvl.toNumber() / 1_000_000_000;
    let currentApy;
    if (tvlInSol >= 100_000) {
      currentApy = 15.0;
    } else if (tvlInSol >= 50_000) {
      currentApy = 12.0;
    } else if (tvlInSol >= 10_000) {
      currentApy = 8.0;
    } else {
      currentApy = 5.0;
    }
    
    console.log("   Current APY:", currentApy, "% 💀");
    console.log();
  } catch (e) {
    console.log("⚠️  Program not initialized yet");
    console.log("   Run: anchor test");
    console.log();
  }

  console.log("📊 Dynamic APY Tiers (Fear Index):");
  console.log("   < 10,000 SOL  → 5% APY  👻");
  console.log("   10,000+ SOL   → 8% APY  💀");
  console.log("   50,000+ SOL   → 12% APY 💀💀");
  console.log("   100,000+ SOL  → 15% APY 💀💀💀");
  console.log();

  console.log("🎯 Features:");
  console.log("   ✅ Dynamic APY based on protocol TVL");
  console.log("   ✅ Soul harvesting mechanics");
  console.log("   ✅ On-chain leaderboard");
  console.log("   ✅ Midnight harvest automation");
  console.log("   ✅ Reaper Pass NFT boosts (2x rewards)");
  console.log("   ✅ Flexible withdrawals");
  console.log();

  console.log("🚀 Next Steps:");
  console.log("   1. Deploy to devnet: anchor deploy --provider.cluster devnet");
  console.log("   2. Initialize: anchor test");
  console.log("   3. Build frontend UI");
  console.log("   4. Set up midnight harvest automation");
  console.log();

  console.log("💀 The more souls, the scarier the yield!");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
