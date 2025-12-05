import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount, 
  mintTo, 
  getAccount 
} from "@solana/spl-token";
import { assert } from "chai";
import * as fs from "fs";
import BN from "bn.js";

// Load IDL directly
const idl = JSON.parse(fs.readFileSync("./target/idl/soul_harvest_vault.json", "utf8"));
const PROGRAM_ID = new PublicKey("CM7bjZs41G4ryhjUMptVRLLd1ojwxHrrE5sGfEGqV5h");

describe("🎃 Soul Harvest Vault - Local Test", () => {
  // Setup connection and provider
  const connection = new Connection("http://localhost:8899", "confirmed");
  
  // Load wallet from default location
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(
      process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`, 
      "utf8"
    )))
  );
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Create program instance
  const program = new Program(idl as anchor.Idl, PROGRAM_ID, provider);
  
  // Test accounts
  let tokenMint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  let configPda: PublicKey;
  let vaultPda: PublicKey;
  let leaderboardPda: PublicKey;
  let achievementsPda: PublicKey;
  let reaperMintKeypair: Keypair;

  before(async () => {
    console.log("\n🎃 Setting up Soul Harvest Vault test...");
    console.log("Wallet:", wallet.publicKey.toString());
    
    // Airdrop SOL if needed
    const balance = await connection.getBalance(wallet.publicKey);
    if (balance < 1_000_000_000) {
      console.log("Requesting airdrop...");
      const sig = await connection.requestAirdrop(wallet.publicKey, 2_000_000_000);
      await connection.confirmTransaction(sig);
    }
    console.log("Balance:", (await connection.getBalance(wallet.publicKey)) / 1e9, "SOL");

    // Create test token mint
    tokenMint = await createMint(
      connection,
      walletKeypair,
      wallet.publicKey,
      null,
      9
    );
    console.log("Token Mint:", tokenMint.toString());

    // Create user token account
    userTokenAccount = await createAccount(
      connection,
      walletKeypair,
      tokenMint,
      wallet.publicKey
    );

    // Mint tokens to user
    await mintTo(
      connection,
      walletKeypair,
      tokenMint,
      userTokenAccount,
      walletKeypair,
      1_000_000_000_000 // 1000 tokens
    );
    console.log("Minted 1000 tokens to user");

    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), wallet.publicKey.toBuffer(), tokenMint.toBuffer()],
      PROGRAM_ID
    );

    [leaderboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("leaderboard"), wallet.publicKey.toBuffer()],
      PROGRAM_ID
    );

    [achievementsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievements"), wallet.publicKey.toBuffer()],
      PROGRAM_ID
    );

    reaperMintKeypair = Keypair.generate();

    console.log("Config PDA:", configPda.toString());
    console.log("Vault PDA:", vaultPda.toString());
    console.log("Achievements PDA:", achievementsPda.toString());
    console.log("\n✅ Setup complete!\n");
  });

  it("1. Initializes the program", async () => {
    try {
      const tx = await program.methods
        .initialize(1000, new BN(1))
        .accounts({
          config: configPda,
          reaperMint: reaperMintKeypair.publicKey,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([reaperMintKeypair])
        .rpc();

      console.log("✅ Initialize tx:", tx);

      const config = await program.account.vaultConfig.fetch(configPda);
      assert.equal(config.baseApy, 1000);
      console.log("   Base APY:", config.baseApy / 100, "%");
    } catch (e: any) {
      if (e.message?.includes("already in use")) {
        console.log("ℹ️  Program already initialized");
      } else {
        throw e;
      }
    }
  });

  it("2. Initializes achievement tracking", async () => {
    try {
      const tx = await program.methods
        .initAchievements()
        .accounts({
          achievements: achievementsPda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Init Achievements tx:", tx);

      const achievements = await program.account.userAchievements.fetch(achievementsPda);
      assert.equal(achievements.user.toString(), wallet.publicKey.toString());
      assert.equal(achievements.rank, 0);
      console.log("   👻 Starting rank: Ghost (0 points)");
    } catch (e: any) {
      if (e.message?.includes("already in use")) {
        console.log("ℹ️  Achievements already initialized");
      } else {
        throw e;
      }
    }
  });

  it("3. Creates a vault with initial deposit", async () => {
    const initialDeposit = new BN(100_000_000_000); // 100 tokens

    vaultTokenAccount = anchor.utils.token.associatedAddress({
      mint: tokenMint,
      owner: vaultPda,
    });

    const tx = await program.methods
      .createVault(initialDeposit)
      .accounts({
        vault: vaultPda,
        leaderboardEntry: leaderboardPda,
        config: configPda,
        owner: wallet.publicKey,
        tokenMint: tokenMint,
        ownerTokenAccount: userTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("✅ Create vault tx:", tx);

    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.balance.toNumber(), initialDeposit.toNumber());
    console.log("   Vault balance:", vault.balance.toNumber() / 1e9, "tokens");
  });

  it("4. Checks and unlocks achievements", async () => {
    const tx = await program.methods
      .checkAchievements()
      .accounts({
        achievements: achievementsPda,
        vault: vaultPda,
        config: configPda,
        user: wallet.publicKey,
      })
      .rpc();

    console.log("✅ Check achievements tx:", tx);

    const achievements = await program.account.userAchievements.fetch(achievementsPda);
    console.log("   Unlocked bitfield:", achievements.unlocked.toString(2).padStart(8, '0'));
    console.log("   Points:", achievements.points);
    console.log("   Rank:", getRankName(achievements.rank));
  });

  it("5. Compounds rewards", async () => {
    // Wait a bit for time to pass
    await new Promise(resolve => setTimeout(resolve, 2000));

    const vaultBefore = await program.account.vault.fetch(vaultPda);

    const tx = await program.methods
      .compound()
      .accounts({
        vault: vaultPda,
        config: configPda,
        leaderboardEntry: leaderboardPda,
        ownerReaperAccount: wallet.publicKey, // Will be ignored if not a token account
        reaperMint: reaperMintKeypair.publicKey,
      })
      .rpc();

    console.log("✅ Compound tx:", tx);

    const vaultAfter = await program.account.vault.fetch(vaultPda);
    const rewards = vaultAfter.balance.toNumber() - vaultBefore.balance.toNumber();
    console.log("   Rewards earned:", rewards);
    console.log("   Souls harvested:", vaultAfter.totalSoulsHarvested.toNumber());
  });

  it("6. Displays final summary", async () => {
    const vault = await program.account.vault.fetch(vaultPda);
    const achievements = await program.account.userAchievements.fetch(achievementsPda);
    const config = await program.account.vaultConfig.fetch(configPda);

    console.log("\n" + "=".repeat(50));
    console.log("🎃 SOUL HARVEST VAULT SUMMARY 🎃");
    console.log("=".repeat(50));
    console.log("\n📊 Vault Stats:");
    console.log(`   Balance: ${(vault.balance.toNumber() / 1e9).toFixed(4)} tokens`);
    console.log(`   Souls Harvested: ${vault.totalSoulsHarvested.toNumber()}`);
    console.log(`   Active: ${vault.isActive}`);
    console.log("\n🏆 Achievements:");
    console.log(`   Unlocked: ${countBits(achievements.unlocked.toNumber())} / 27`);
    console.log(`   Points: ${achievements.points}`);
    console.log(`   Rank: ${getRankName(achievements.rank)} ${getRankEmoji(achievements.rank)}`);
    console.log("\n🌐 Protocol Stats:");
    console.log(`   Total TVL: ${(config.totalTvl.toNumber() / 1e9).toFixed(4)} tokens`);
    console.log("=".repeat(50));
  });
});

function getRankName(rank: number): string {
  const ranks = ["Ghost", "Specter", "Wraith", "Phantom", "Reaper"];
  return ranks[rank] || "Unknown";
}

function getRankEmoji(rank: number): string {
  const emojis = ["👻", "👤", "💀", "👑", "⚔️"];
  return emojis[rank] || "❓";
}

function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}
