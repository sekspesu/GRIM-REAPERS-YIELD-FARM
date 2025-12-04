# Setup Instructions - Troubleshooting SSL Issues

You're experiencing an SSL connection error when trying to install Solana. Here are several solutions:

## Current Status
✅ Rust installed (1.91.1)
❌ Node.js/npm not installed
❌ Solana CLI not installed
❌ Anchor not installed

## Solution 1: Install Homebrew First (Recommended)

Homebrew is the easiest way to install development tools on macOS:

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install everything through Homebrew
brew install node
brew install solana
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

## Solution 2: Fix SSL and Retry

The SSL error might be due to network/firewall issues. Try:

```bash
# Update certificates
sudo security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/certs.pem
export SSL_CERT_FILE=/tmp/certs.pem

# Retry Solana installation
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

## Solution 3: Manual Download

If curl continues to fail, download manually:

1. Visit: https://github.com/solana-labs/solana/releases
2. Download the latest release for macOS
3. Extract and install manually

## Solution 4: Use Docker (Alternative)

If you can't install locally, use Docker:

```bash
# Pull Solana development image
docker pull projectserum/build:v0.27.0

# Run tests in container
docker run -v $(pwd):/workdir -w /workdir projectserum/build:v0.27.0 anchor test
```

## Solution 5: Install Node.js First

You need Node.js for the test suite:

```bash
# Download from nodejs.org
# Or if you get Homebrew working:
brew install node

# Verify
node --version
npm --version
```

## Quick Check: What's Blocking You?

Run this to diagnose:

```bash
# Test network connectivity
curl -v https://release.solana.com 2>&1 | grep -i ssl

# Check if behind corporate firewall/proxy
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Check DNS
nslookup release.solana.com
```

## Recommended Order

1. **Install Homebrew** (if you don't have it)
2. **Install Node.js**: `brew install node`
3. **Install Solana**: `brew install solana` (easier than curl method)
4. **Install Anchor**: Use cargo (you already have Rust)
5. **Build & Test**: `npm install && anchor build && anchor test`

## If All Else Fails

You can still verify your Rust code compiles:

```bash
# Check if the Solana program compiles
cargo check --manifest-path programs/soul-harvest-vault/Cargo.toml

# Build just the Rust program (without Anchor)
cargo build-bpf --manifest-path programs/soul-harvest-vault/Cargo.toml
```

## Need Help?

The SSL error suggests either:
- Network/firewall blocking the connection
- Outdated SSL certificates
- Corporate proxy interfering

Try the Homebrew method first - it's the most reliable on macOS.
