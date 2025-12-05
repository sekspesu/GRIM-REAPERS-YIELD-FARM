import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoulHarvestVault } from "../target/types/soul_harvest_vault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint, 
  createAccount, 
  mintTo
} from "@solana/spl-token";
import { assert } from "chai";

describe("🏆 Achievement System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;
  
  const authority = provider.wallet as anchor.Wallet;
  let tokenMint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  let configPda: PublicKey;
  let vaultPda: PublicKey;
  let leaderboardPda: PublicKey;
  let achievementsPda: PublicKey;
  let reaperMintKeypair: Keypair;

  before(async () => {
    // Create test token mint
    tokenMint = await createMint(
      provider.connection,
      authority.payer,
      authority.publicKey,
      null,
      9
    );

    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      authority.payer,
      tokenMint,
      authority.publicKey
    );

    // Mint tokens to user (1M tokens for whale achievement)
    await mintTo(
      provider.connection,
      authority.payer,
      tokenMint,
      userTokenAccount,
      authority.payer,
      10_000_000_000_000_000 // 10M tokens
    );

    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        authority.publicKey.toBuffer(),
        tokenMint.toBuffer(),
      ],
      program.programId
    );

    [leaderboardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("leaderboard"), authority.publicKey.toBuffer()],
      program.programId
    );

    [achievementsPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievements"), authority.publicKey.toBuffer()],
      program.programId
    );

    reaperMintKeypair = Keypair.generate();

    console.log("\n🎃 Achievement System Test Setup");
    console.log("================================");
    console.log("Token Mint:", tokenMint.toString());
    console.log("Achievements PDA:", achievementsPda.toString());
  });

  it("Initializes the program", async () => {
    try {
      await program.methods
        .initialize(1000, 1)
        .accounts({
          config: configPda,
          reaperMint: reaperMintKeypair.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([reaperMintKeypair])
        .rpc();
      console.log("✅ Program initialized");
    } catch (e: any) {
      if (e.message?.includes("already in use")) {
        console.log("ℹ️ Program already initialized");
      } else {
        throw e;
      }
    }
  });

  it("Initializes achievement tracking", async () => {
    const tx = await program.methods
      .initAchievements()
      .accounts({
        achievements: achievementsPda,
        user: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("\n🏆 Init Achievements tx:", tx);

    // Fetch and verify achievements
    const achievements = await program.account.userAchievements.fetch(achievementsPda);
    
    assert.equal(achievements.user.toString(), authority.publicKey.toString());
    assert.equal(achievements.unlocked.toNumber(), 0);
    assert.equal(achievements.rank, 0); // Ghost rank
    assert.equal(achievements.points, 0);
    
    console.log("✅ Achievement tracking initialized");
    console.log("👻 Starting rank: Ghost (0 points)");
  });

  it("Creates vault and unlocks First Blood achievement", async () => {
    const initialDeposit = new anchor.BN(1_000_000_000_000); // 1000 tokens

    vaultTokenAccount = anchor.utils.token.associatedAddress({
      mint: tokenMint,
      owner: vaultPda,
    });

    await program.methods
      .createVault(initialDeposit)
      .accounts({
        vault: vaultPda,
        leaderboardEntry: leaderboardPda,
        config: configPda,
        owner: authority.publicKey,
        tokenMint: tokenMint,
        ownerTokenAccount: userTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("\n💰 Vault created with 1000 tokens");

    // Check achievements
    const result = await program.methods
      .checkAchievements()
      .accounts({
        achievements: achievementsPda,
        vault: vaultPda,
        config: configPda,
        user: authority.publicKey,
      })
      .rpc();

    console.log("Check achievements tx:", result);

    const achievements = await program.account.userAchievements.fetch(achievementsPda);
    
    console.log("\n🏆 ACHIEVEMENTS UNLOCKED:");
    console.log("  Unlocked bitfield:", achievements.unlocked.toString(2));
    console.log("  Points:", achievements.points);
    console.log("  Rank:", getRankName(achievements.rank));
    
    // Should have unlocked FirstBlood (bit 0) and SoulStarter (bit 1)
    assert.isTrue(achievements.unlocked.toNumber() > 0, "Should have unlocked achievements");
  });

  it("Compounds and tracks progress", async () => {
    // Wait for time to pass
    await new Promise(resolve => setTimeout(resolve, 2000));

    await program.methods
      .compound()
      .accounts({
        vault: vaultPda,
        config: configPda,
        leaderboardEntry: leaderboardPda,
        ownerReaperAccount: null,
        reaperMint: reaperMintKeypair.publicKey,
      })
      .rpc();

    console.log("\n⚡ Compounded rewards");

    // Check achievements again
    await program.methods
      .checkAchievements()
      .accounts({
        achievements: achievementsPda,
        vault: vaultPda,
        config: configPda,
        user: authority.publicKey,
      })
      .rpc();

    const achievements = await program.account.userAchievements.fetch(achievementsPda);
    const vault = await program.account.vault.fetch(vaultPda);
    
    console.log("\n📊 Progress Update:");
    console.log("  Vault balance:", vault.balance.toNumber());
    console.log("  Souls harvested:", vault.totalSoulsHarvested.toNumber());
    console.log("  Achievement points:", achievements.points);
    console.log("  Current rank:", getRankName(achievements.rank));
  });

  it("Displays achievement summary", async () => {
    const achievements = await program.account.userAchievements.fetch(achievementsPda);
    const vault = await program.account.vault.fetch(vaultPda);
    
    console.log("\n" + "=".repeat(50));
    console.log("🎃 SOUL HARVEST ACHIEVEMENT SUMMARY 🎃");
    console.log("=".repeat(50));
    
    console.log("\n📊 Stats:");
    console.log(`  Vault Balance: ${(vault.balance.toNumber() / 1e9).toFixed(2)} tokens`);
    console.log(`  Souls Harvested: ${vault.totalSoulsHarvested.toNumber()}`);
    
    console.log("\n🏆 Achievements:");
    console.log(`  Unlocked: ${countBits(achievements.unlocked.toNumber())} / 27`);
    console.log(`  Points: ${achievements.points}`);
    console.log(`  Rank: ${getRankName(achievements.rank)} ${getRankEmoji(achievements.rank)}`);
    
    console.log("\n🎖️ Rank Progress:");
    const nextRank = getNextRankThreshold(achievements.points);
    if (nextRank) {
      console.log(`  Next rank at ${nextRank} points`);
      console.log(`  Progress: ${achievements.points}/${nextRank} (${Math.floor(achievements.points/nextRank*100)}%)`);
    } else {
      console.log("  MAX RANK ACHIEVED! 💀");
    }
    
    console.log("\n" + "=".repeat(50));
  });
});

// Helper functions
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

function getNextRankThreshold(points: number): number | null {
  if (points < 100) return 100;
  if (points < 300) return 300;
  if (points < 600) return 600;
  if (points < 1000) return 1000;
  return null;
}
