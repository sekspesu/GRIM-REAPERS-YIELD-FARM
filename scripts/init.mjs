import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";
import * as anchor from "@coral-xyz/anchor";

const PROGRAM_ID = new PublicKey("CM7bjZs41G4ryhjUMptVRLLd1ojwxHrrE5sGfEGqV5h");

async function main() {
  console.log("🎃 Initializing Soul Harvest Vault on Devnet\n");

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load wallet
  const walletPath = `${os.homedir()}/.config/solana/id.json`;
  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const authority = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  
  console.log("Authority:", authority.publicKey.toString());

  // Derive config PDA
  const [configPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  console.log("Config PDA:", configPda.toString());

  // Check if already initialized
  const configInfo = await connection.getAccountInfo(configPda);
  if (configInfo) {
    console.log("\n✅ Program already initialized!");
    console.log("Config account size:", configInfo.data.length, "bytes");
    return;
  }

  console.log("\nInitializing program...");

  // Load IDL
  const idl = JSON.parse(fs.readFileSync("frontend/public/idl/soul_harvest_vault.json", "utf8"));
  
  // Create wallet adapter
  const wallet = {
    publicKey: authority.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(authority);
      return tx;
    },
    signAllTransactions: async (txs) => txs.map(tx => { tx.partialSign(authority); return tx; }),
  };

  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);

  // Generate Reaper Pass mint
  const reaperMint = Keypair.generate();
  console.log("Reaper Mint:", reaperMint.publicKey.toString());

  const BN = anchor.BN || anchor.default?.BN || (await import("bn.js")).default;
  const tx = await program.methods
    .initialize(500, new BN(1)) // 5% APY, 1 soul per token
    .accounts({
      config: configPda,
      reaperMint: reaperMint.publicKey,
      authority: authority.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([reaperMint, authority])
    .rpc();

  console.log("\n✅ Initialized!");
  console.log("TX:", tx);
  console.log("https://solscan.io/tx/" + tx + "?cluster=devnet");
}

main().catch(console.error);
