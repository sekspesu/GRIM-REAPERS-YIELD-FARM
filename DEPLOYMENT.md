# Soul Harvest Vault - Deployment Guide

Complete guide for deploying the Soul Harvest Vault program to Solana networks.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Devnet Deployment](#devnet-deployment)
- [Mainnet Deployment](#mainnet-deployment)
- [Post-Deployment](#post-deployment)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Rust**: 1.70 or higher
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  rustup update
  ```

- **Solana CLI**: 1.16 or higher
  ```bash
  sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
  solana --version
  ```

- **Anchor**: 0.29 or higher
  ```bash
  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
  avm install latest
  avm use latest
  anchor --version
  ```

- **Node.js**: 18 or higher
  ```bash
  node --version
  npm --version
  ```

### Required Accounts

- Solana wallet with sufficient SOL for deployment
- Program keypair (will be generated if not exists)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd soul-harvest-vault

# Install Node dependencies
npm install

# Build the program
anchor build
```

### 2. Generate Program Keypair

```bash
# Generate a new keypair for the program
solana-keygen new -o target/deploy/soul_harvest_vault-keypair.json

# Get the program ID
solana address -k target/deploy/soul_harvest_vault-keypair.json
```

### 3. Update Program ID

Update the program ID in the following files:

**lib.rs**:
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**Anchor.toml**:
```toml
[programs.localnet]
soul_harvest_vault = "YOUR_PROGRAM_ID_HERE"

[programs.devnet]
soul_harvest_vault = "YOUR_PROGRAM_ID_HERE"

[programs.mainnet]
soul_harvest_vault = "YOUR_PROGRAM_ID_HERE"
```

### 4. Rebuild

```bash
anchor build
```

## Local Development

### Start Local Validator

```bash
# Start Solana test validator
solana-test-validator

# In another terminal, configure CLI for localhost
solana config set --url localhost
```

### Deploy Locally

```bash
# Deploy to local validator
anchor deploy

# Run tests
anchor test --skip-local-validator
```

### Initialize Program Locally

```bash
# Run initialization script (create one based on tests)
ts-node scripts/initialize.ts
```

## Devnet Deployment

### 1. Configure for Devnet

```bash
# Set Solana CLI to devnet
solana config set --url devnet

# Verify configuration
solana config get
```

### 2. Fund Deployment Wallet

```bash
# Airdrop SOL for deployment (may need multiple airdrops)
solana airdrop 2

# Check balance
solana balance

# If airdrop fails, use a faucet:
# https://faucet.solana.com/
```

### 3. Deploy to Devnet

```bash
# Deploy the program
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show YOUR_PROGRAM_ID
```

### 4. Initialize Program on Devnet

Create an initialization script:

**scripts/initialize-devnet.ts**:
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SoulHarvestVault } from "../target/types/soul_harvest_vault";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

async function main() {
  // Configure provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SoulHarvestVault as Program<SoulHarvestVault>;
  const authority = provider.wallet;

  // Derive config PDA
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  // Generate Reaper Pass mint
  const reaperMint = Keypair.generate();

  console.log("Initializing Soul Harvest Vault...");
  console.log("Program ID:", program.programId.toString());
  console.log("Authority:", authority.publicKey.toString());
  console.log("Config PDA:", configPda.toString());
  console.log("Reaper Mint:", reaperMint.publicKey.toString());

  // Initialize program
  const tx = await program.methods
    .initialize(1000, new anchor.BN(1)) // 10% APY, 1 soul per token
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

  console.log("Initialization successful!");
  console.log("Transaction signature:", tx);

  // Fetch and display config
  const config = await program.account.vaultConfig.fetch(configPda);
  console.log("\nProgram Configuration:");
  console.log("- Authority:", config.authority.toString());
  console.log("- Reaper Mint:", config.reaperMint.toString());
  console.log("- Base APY:", config.baseApy, "bps");
  console.log("- Reaper Boost:", config.reaperBoost, "bps");
  console.log("- Souls per Token:", config.soulsPerToken.toString());
  console.log("- Reaper Supply:", config.reaperSupply, "/ 1666");
}

main().catch(console.error);
```

Run the script:
```bash
ts-node scripts/initialize-devnet.ts
```

### 5. Verify Devnet Deployment

```bash
# Check program account
solana program show YOUR_PROGRAM_ID --url devnet

# Check config account
solana account CONFIG_PDA --url devnet
```

## Mainnet Deployment

### 1. Prepare for Mainnet

**Important**: Mainnet deployment requires careful preparation:

- Ensure code is thoroughly tested on devnet
- Have sufficient SOL for deployment (~5-10 SOL recommended)
- Backup all keypairs securely
- Consider using a hardware wallet for authority
- Plan for program upgrades (keep upgrade authority or make immutable)

### 2. Configure for Mainnet

```bash
# Set Solana CLI to mainnet
solana config set --url mainnet-beta

# Verify configuration
solana config get
```

### 3. Fund Deployment Wallet

```bash
# Transfer SOL to deployment wallet
# DO NOT use airdrop on mainnet (it doesn't exist)

# Check balance
solana balance

# Ensure you have at least 5-10 SOL for deployment
```

### 4. Deploy to Mainnet

```bash
# Deploy the program
anchor deploy --provider.cluster mainnet-beta

# Verify deployment
solana program show YOUR_PROGRAM_ID --url mainnet-beta
```

### 5. Initialize Program on Mainnet

**IMPORTANT**: Review all parameters carefully before initializing on mainnet.

```bash
# Run initialization script with mainnet configuration
anchor run initialize-mainnet
```

### 6. Security Considerations

#### Option A: Keep Upgrade Authority (Recommended for initial launch)

```bash
# Check current upgrade authority
solana program show YOUR_PROGRAM_ID

# The authority can upgrade the program
anchor upgrade target/deploy/soul_harvest_vault.so --program-id YOUR_PROGRAM_ID
```

#### Option B: Make Program Immutable (After stabilization)

```bash
# Remove upgrade authority (IRREVERSIBLE!)
solana program set-upgrade-authority YOUR_PROGRAM_ID --final

# Verify
solana program show YOUR_PROGRAM_ID
```

## Post-Deployment

### 1. Save Important Information

Create a deployment record:

**deployment-info.json**:
```json
{
  "network": "mainnet-beta",
  "programId": "YOUR_PROGRAM_ID",
  "configPda": "CONFIG_PDA",
  "reaperMint": "REAPER_MINT",
  "authority": "AUTHORITY_PUBKEY",
  "deploymentDate": "2024-11-02",
  "transactionSignature": "TX_SIGNATURE",
  "configuration": {
    "baseApy": 1000,
    "reaperBoost": 20000,
    "soulsPerToken": 1,
    "maxReaperSupply": 1666
  }
}
```

### 2. Update Frontend Configuration

Update your frontend application with the deployed program ID:

```typescript
// config.ts
export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID");
export const REAPER_MINT = new PublicKey("REAPER_MINT");
export const CONFIG_PDA = new PublicKey("CONFIG_PDA");
```

### 3. Set Up Monitoring

Consider setting up monitoring for:
- Program account balance
- Transaction success/failure rates
- Error logs
- Reaper Pass supply
- Total TVL

Tools:
- Solana Beach: https://solanabeach.io/
- Solscan: https://solscan.io/
- Custom monitoring with RPC calls

### 4. Create Admin Scripts

Create scripts for common admin tasks:

**scripts/mint-reaper-pass.ts**:
```typescript
// Script to mint Reaper Pass NFTs
// (See API_REFERENCE.md for implementation)
```

**scripts/check-stats.ts**:
```typescript
// Script to check program statistics
async function checkStats() {
  const config = await program.account.vaultConfig.fetch(configPda);
  const vaults = await program.account.vault.all();
  const leaderboard = await program.account.leaderboardEntry.all();
  
  console.log("Program Statistics:");
  console.log("- Total Vaults:", vaults.length);
  console.log("- Active Vaults:", vaults.filter(v => v.account.isActive).length);
  console.log("- Reaper Passes Minted:", config.reaperSupply);
  console.log("- Leaderboard Entries:", leaderboard.length);
  
  const totalTvl = leaderboard.reduce(
    (sum, entry) => sum.add(entry.account.tvl),
    new BN(0)
  );
  console.log("- Total TVL:", totalTvl.toString());
}
```

## Verification

### Verify Program Deployment

```bash
# Get program info
solana program show YOUR_PROGRAM_ID

# Expected output:
# Program Id: YOUR_PROGRAM_ID
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: ...
# Authority: YOUR_AUTHORITY (or None if immutable)
# Last Deployed In Slot: ...
# Data Length: ... bytes
```

### Verify Program Functionality

Run integration tests against deployed program:

```bash
# Test on devnet
anchor test --skip-build --skip-deploy --provider.cluster devnet

# For mainnet, create read-only tests
npm run test:mainnet-readonly
```

### Verify Accounts

```bash
# Check config account
anchor account vault-config CONFIG_PDA

# Check a vault account
anchor account vault VAULT_PDA

# Check leaderboard entry
anchor account leaderboard-entry LEADERBOARD_PDA
```

## Troubleshooting

### Deployment Fails: Insufficient Funds

```bash
# Check balance
solana balance

# Need more SOL for deployment
# Devnet: Use faucet
# Mainnet: Transfer from exchange or another wallet
```

### Deployment Fails: Program Already Deployed

```bash
# If you need to redeploy, use upgrade instead
anchor upgrade target/deploy/soul_harvest_vault.so --program-id YOUR_PROGRAM_ID
```

### Initialization Fails: Account Already Exists

```bash
# Config already initialized
# Either use existing config or close and reinitialize (devnet only)

# Check existing config
anchor account vault-config CONFIG_PDA
```

### Transaction Fails: Blockhash Not Found

```bash
# Increase commitment level
solana config set --commitment confirmed

# Or retry the transaction
```

### Program Upgrade Fails: Authority Mismatch

```bash
# Check current authority
solana program show YOUR_PROGRAM_ID

# Ensure you're using the correct wallet
solana address

# Set correct keypair
solana config set --keypair /path/to/authority-keypair.json
```

## Upgrade Process

### 1. Prepare Upgrade

```bash
# Make code changes
# Update version in Cargo.toml
# Test thoroughly on devnet

# Build new version
anchor build
```

### 2. Deploy Upgrade

```bash
# Upgrade on devnet first
anchor upgrade target/deploy/soul_harvest_vault.so \
  --program-id YOUR_PROGRAM_ID \
  --provider.cluster devnet

# Test upgraded program
anchor test --skip-build --skip-deploy --provider.cluster devnet

# If successful, upgrade mainnet
anchor upgrade target/deploy/soul_harvest_vault.so \
  --program-id YOUR_PROGRAM_ID \
  --provider.cluster mainnet-beta
```

### 3. Verify Upgrade

```bash
# Check program info
solana program show YOUR_PROGRAM_ID

# Verify new functionality works
npm run test:mainnet-readonly
```

## Cost Estimates

### Devnet
- Deployment: Free (use faucet)
- Initialization: ~0.01 SOL
- Testing: Free

### Mainnet
- Deployment: ~2-5 SOL (depends on program size)
- Initialization: ~0.01 SOL
- Rent for config account: ~0.002 SOL (one-time)
- Per-user vault creation: ~0.002 SOL (paid by user)
- Transactions: ~0.000005 SOL per transaction

## Security Checklist

Before mainnet deployment:

- [ ] All tests passing
- [ ] Code reviewed by multiple developers
- [ ] Security audit completed (recommended)
- [ ] Upgrade authority plan decided
- [ ] Admin keypairs backed up securely
- [ ] Monitoring set up
- [ ] Emergency procedures documented
- [ ] Rate limiting considered (if applicable)
- [ ] Frontend security reviewed
- [ ] Documentation complete

## Support

For deployment issues:
- Check Solana Discord: https://discord.gg/solana
- Anchor Discord: https://discord.gg/anchor
- GitHub Issues: <repository-url>/issues

## Additional Resources

- Solana Documentation: https://docs.solana.com/
- Anchor Documentation: https://www.anchor-lang.com/
- Solana Cookbook: https://solanacookbook.com/
- Solana Program Library: https://spl.solana.com/
