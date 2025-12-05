import * as anchor from "@coral-xyz/anchor";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, PublicKey, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";

const PROGRAM_ID = new PublicKey("CM7bjZs41G4ryhjUMptVRLLd1ojwxHrrE5sGfEGqV5h");

async function main() {
  console.log("🎃 Initializing Soul Harvest Vault on Devnet 🎃\n");

  // Setup connection and wallet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const authority = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  
  const wallet = {
    publicKey: authority.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(authority);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      return txs.map(tx => {
        tx.partialSign(authority);
        return tx;
      });
    },
  };

  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load the old-format IDL
  const idl = JSON.parse(fs.readFileSync("frontend/public/idl/soul_harvest_vault.json", "utf8"));
  const program = new anchor.Program(idl, PROGRAM_ID, provider);

  console.log("Program ID:", PROGRAM_ID.toString());
  console.log("Authority:", authority.publicKey.toString());

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  console.log("Config PDA:", configPda.toString());

  // Check if already initialized
  try {
    const existingConfig = await program.account.vaultConfig.fetch(configPda);
    console.log("\n✅ Program already initialized!");
    console.log("Reaper Mint:", (existingConfig as any).reaperMint.toString());
    console.log("Base APY:", (existingConfig as any).baseApy / 100, "%");
    console.log("Total TVL:", (existingConfig as any).totalTvl.toString());
    return;
  } catch (e) {
    console.log("\nConfig not found, initializing...");
  }

  // Generate Reaper Pass mint keypair
  const reaperMint = Keypair.generate();
  const BASE_APY = 500; // 5% base APY
  const SOULS_PER_TOKEN = new anchor.BN(1);

  console.log("Reaper Mint:", reaperMint.publicKey.toString());
  console.log("Base APY:", BASE_APY / 100, "%");

  try {
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
      .signers([reaperMint, authority])
      .rpc();

    console.log("\n✅ Initialized! TX:", tx);
    console.log("View on Solscan: https://solscan.io/tx/" + tx + "?cluster=devnet");

    // Fetch and display config
    const config = await program.account.vaultConfig.fetch(configPda);
    console.log("\nConfig:");
    console.log("- Base APY:", (config as any).baseApy / 100, "%");
    console.log("- Reaper Mint:", (config as any).reaperMint.toString());
    console.log("- Total TVL:", (config as any).totalTvl.toString());
  } catch (err) {
    console.error("Error initializing:", err);
  }
}

main().catch(console.error);
