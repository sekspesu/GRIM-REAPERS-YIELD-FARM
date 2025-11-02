import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoulHarvestVault } from "../target/types/soul_harvest_vault";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

/**
 * Initialize Soul Harvest Vault on Mainnet
 * 
 * This script initializes the Grim Reaper Vault program on mainnet-beta
 * with production-ready parameters.
 */

async function main() {
  console.log("🎃 Initializing Grim Reaper Vault on Mainnet 🎃");
  console.log("=================================================\n");

  // Configure provider for mainnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;
  const authority = provider.wallet;

  console.log("📋 Configuration:");
  console.log("Program ID:", program.programId.toString());
  console.log("Authority:", authority.publicKey.toString());
  console.log("Cluster:", provider.connection.rpcEndpoint);
  console.log("");

  // Derive config PDA
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  // Generate Reaper Pass mint
  const reaperMint = Keypair.generate();

  console.log("🔑 Accounts:");
  console.log("Config PDA:", configPda.toString());
  console.log("Reaper Mint:", reaperMint.publicKey.toString());
  console.log("");

  // Production parameters
  const BASE_APY = 1000; // 10% base APY
  const REAPER_BOOST = 20000; // 200% boost with Reaper Pass
  const SOULS_PER_TOKEN = new anchor.BN(1);

  console.log("⚙️  Parameters:");
  console.log("Base APY:", BASE_APY / 100, "%");
  console.log("Reaper Boost:", REAPER_BOOST / 100, "%");
  console.log("Total APY with Reaper:", (BASE_APY + REAPER_BOOST) / 100, "%");
  console.log("Souls per Token:", SOULS_PER_TOKEN.toString());
  console.log("Max Reaper Supply: 1666");
  console.log("");

  // Final confirmation
  console.log("⚠️  FINAL CONFIRMATION ⚠️");
  console.log("You are about to initialize on MAINNET-BETA");
  console.log("This action cannot be undone.");
  console.log("");

  // In production, you might want to add a confirmation prompt
  // For now, we'll proceed directly

  try {
    console.log("🚀 Sending initialization transaction...");
    
    const tx = await program.methods
      .initialize(BASE_APY, SOULS_PER_TOKEN)
      .accounts({
        config: configPda,
        reaperMint: reaperMint.publicKey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([reaperMint])
      .rpc();

    console.log("✅ Initialization successful!");
    console.log("Transaction signature:", tx);
    console.log("");

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    await provider.connection.confirmTransaction(tx, "confirmed");
    console.log("✅ Transaction confirmed");
    console.log("");

    // Fetch and display config
    console.log("📊 Fetching program configuration...");
    const config = await program.account.vaultConfig.fetch(configPda);
    
    console.log("");
    console.log("🎉 GRIM REAPER VAULT IS INITIALIZED! 🎉");
    console.log("======================================");
    console.log("");
    console.log("Program Configuration:");
    console.log("- Authority:", config.authority.toString());
    console.log("- Reaper Mint:", config.reaperMint.toString());
    console.log("- Base APY:", config.baseApy, "bps (", config.baseApy / 100, "%)");
    console.log("- Reaper Boost:", config.reaperBoost, "bps (", config.reaperBoost / 100, "%)");
    console.log("- Souls per Token:", config.soulsPerToken.toString());
    console.log("- Reaper Supply:", config.reaperSupply, "/ 1666");
    console.log("- Paused:", config.paused);
    console.log("");

    console.log("🔗 Explorer Links:");
    console.log("Program:", `https://solscan.io/account/${program.programId.toString()}`);
    console.log("Config:", `https://solscan.io/account/${configPda.toString()}`);
    console.log("Reaper Mint:", `https://solscan.io/token/${reaperMint.publicKey.toString()}`);
    console.log("Transaction:", `https://solscan.io/tx/${tx}`);
    console.log("");

    console.log("📝 Save this information:");
    console.log("========================");
    console.log(JSON.stringify({
      network: "mainnet-beta",
      programId: program.programId.toString(),
      configPda: configPda.toString(),
      reaperMint: reaperMint.publicKey.toString(),
      authority: authority.publicKey.toString(),
      deploymentDate: new Date().toISOString(),
      transactionSignature: tx,
      configuration: {
        baseApy: BASE_APY,
        reaperBoost: REAPER_BOOST,
        soulsPerToken: SOULS_PER_TOKEN.toString(),
        maxReaperSupply: 1666
      }
    }, null, 2));
    console.log("");

    console.log("✅ Next steps:");
    console.log("1. Update frontend with program ID and config PDA");
    console.log("2. Verify on Solana explorers");
    console.log("3. Set up monitoring");
    console.log("4. Test with small deposits first");
    console.log("");
    console.log("💀 May the yields be ever in your favor! 💀");

  } catch (error) {
    console.error("❌ Initialization failed:");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
