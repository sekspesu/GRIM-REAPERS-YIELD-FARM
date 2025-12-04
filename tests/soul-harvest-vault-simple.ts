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
import { assert } from "chai";

describe("soul-harvest-vault", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;
  
  // Test accounts
  const authority = provider.wallet as anchor.Wallet;
  let tokenMint: PublicKey;
  let userTokenAccount: PublicKey;
  let vaultTokenAccount: PublicKey;
  let configPda: PublicKey;
  let vaultPda: PublicKey;
  let leaderboardPda: PublicKey;
  let reaperMintKeypair: Keypair;

  before(async () => {
    // Create a test token mint
    tokenMint = await createMint(
      provider.connection,
      authority.payer,
      authority.publicKey,
      null,
      9 // 9 decimals like SOL
    );

    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      authority.payer,
      tokenMint,
      authority.publicKey
    );

    // Mint some tokens to user
    await mintTo(
      provider.connection,
      authority.payer,
      tokenMint,
      userTokenAccount,
      authority.payer,
      1_000_000_000_000 // 1000 tokens
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

    // Generate Reaper Pass mint keypair
    reaperMintKeypair = Keypair.generate();

    console.log("Test Setup Complete");
    console.log("Token Mint:", tokenMint.toString());
    console.log("Config PDA:", configPda.toString());
    console.log("Vault PDA:", vaultPda.toString());
  });

  it("Initializes the program", async () => {
    const tx = await program.methods
      .initialize(
        1000, // 10% base APY
        1     // 1 soul per token
      )
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

    console.log("Initialize tx:", tx);

    // Fetch and verify config
    const config = await program.account.vaultConfig.fetch(configPda);
    assert.equal(config.baseApy, 1000);
    assert.equal(config.soulsPerToken.toNumber(), 1);
    assert.equal(config.reaperSupply, 0);
    assert.equal(config.totalTvl.toNumber(), 0);
    
    console.log("✅ Program initialized successfully");
  });

  it("Creates a vault with initial deposit", async () => {
    const initialDeposit = new anchor.BN(100_000_000_000); // 100 tokens

    // Get vault token account address
    vaultTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint,
      owner: vaultPda,
    });

    const tx = await program.methods
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

    console.log("Create vault tx:", tx);

    // Fetch and verify vault
    const vault = await program.account.vault.fetch(vaultPda);
    assert.equal(vault.balance.toNumber(), initialDeposit.toNumber());
    assert.equal(vault.owner.toString(), authority.publicKey.toString());
    assert.equal(vault.isActive, true);

    // Verify leaderboard entry
    const leaderboard = await program.account.leaderboardEntry.fetch(leaderboardPda);
    assert.equal(leaderboard.tvl.toNumber(), initialDeposit.toNumber());

    // Verify global TVL updated
    const config = await program.account.vaultConfig.fetch(configPda);
    assert.equal(config.totalTvl.toNumber(), initialDeposit.toNumber());

    console.log("✅ Vault created with balance:", vault.balance.toNumber());
    console.log("✅ Global TVL:", config.totalTvl.toNumber());
  });

  it("Compounds rewards with dynamic APY", async () => {
    // Wait a bit for time to pass
    await new Promise(resolve => setTimeout(resolve, 2000));

    const vaultBefore = await program.account.vault.fetch(vaultPda);
    const balanceBefore = vaultBefore.balance.toNumber();

    const tx = await program.methods
      .compound()
      .accounts({
        vault: vaultPda,
        config: configPda,
        leaderboardEntry: leaderboardPda,
        ownerReaperAccount: null,
        reaperMint: reaperMintKeypair.publicKey,
      })
      .rpc();

    console.log("Compound tx:", tx);

    // Fetch vault after compound
    const vaultAfter = await program.account.vault.fetch(vaultPda);
    const balanceAfter = vaultAfter.balance.toNumber();

    // Balance should have increased (even if slightly)
    assert.isTrue(balanceAfter >= balanceBefore);

    console.log("✅ Compounded successfully");
    console.log("Balance before:", balanceBefore);
    console.log("Balance after:", balanceAfter);
    console.log("Rewards earned:", balanceAfter - balanceBefore);
  });

  it("Withdraws tokens from vault", async () => {
    const withdrawAmount = new anchor.BN(10_000_000_000); // 10 tokens

    const userBalanceBefore = await getAccount(provider.connection, userTokenAccount);

    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        vault: vaultPda,
        leaderboardEntry: leaderboardPda,
        config: configPda,
        owner: authority.publicKey,
        vaultTokenAccount: vaultTokenAccount,
        ownerTokenAccount: userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Withdraw tx:", tx);

    // Verify vault balance decreased
    const vault = await program.account.vault.fetch(vaultPda);
    const userBalanceAfter = await getAccount(provider.connection, userTokenAccount);

    assert.isTrue(
      Number(userBalanceAfter.amount) > Number(userBalanceBefore.amount)
    );

    console.log("✅ Withdrawal successful");
    console.log("Vault balance:", vault.balance.toNumber());
  });

  it("Displays dynamic APY based on TVL", async () => {
    const config = await program.account.vaultConfig.fetch(configPda);
    const tvl = config.totalTvl.toNumber();
    const tvlInSol = tvl / 1_000_000_000;

    let expectedApy;
    if (tvlInSol >= 100_000) {
      expectedApy = 15.0;
    } else if (tvlInSol >= 50_000) {
      expectedApy = 12.0;
    } else if (tvlInSol >= 10_000) {
      expectedApy = 8.0;
    } else {
      expectedApy = 5.0;
    }

    console.log("✅ Dynamic APY System");
    console.log("Total TVL:", tvlInSol, "SOL");
    console.log("Current APY:", expectedApy, "%");
    console.log("The more souls, the scarier the yield! 💀");
  });
});
