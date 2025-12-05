import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as os from "os";

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
  const [configPda, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  console.log("Config PDA:", configPda.toString());

  // Check if already initialized
  const configInfo = await connection.getAccountInfo(configPda);
  if (configInfo) {
    console.log("\n✅ Program already initialized!");
    console.log("Config account exists with", configInfo.data.length, "bytes");
    return;
  }

  console.log("\nConfig not found, needs initialization.");
  console.log("\nTo initialize, run the anchor test which includes initialization.");
  console.log("Or use the frontend to interact with the program.");
}

main().catch(console.error);
