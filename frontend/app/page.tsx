'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);
const VaultDashboard = dynamic(() => import('../components/VaultDashboard'), {
  ssr: false,
});
const WalletConnectionTest = dynamic(() => import('../components/WalletConnectionTest'), {
  ssr: false,
});

require('@solana/wallet-adapter-react-ui/styles.css');

export default function Home() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Initialize wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gradient-to-b from-halloween-black via-halloween-purple to-halloween-black">
            {/* Header */}
            <header className="border-b border-halloween-orange/30 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-5xl skull-glow">💀</span>
                  <div>
                    <h1 className="text-3xl font-bold glow text-halloween-orange">
                      Soul Harvest Vault
                    </h1>
                    <p className="text-sm text-gray-400">Where Fear Drives Yield</p>
                  </div>
                </div>
                <WalletMultiButton className="!bg-halloween-orange hover:!bg-halloween-orange/80" />
              </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
              <WalletConnectionTest />
              <VaultDashboard />
            </main>

            {/* Footer */}
            <footer className="border-t border-halloween-orange/30 mt-16">
              <div className="container mx-auto px-4 py-6 text-center text-gray-400">
                <p>Built for Kiroween Hackathon 2024 🎃</p>
                <p className="text-sm mt-2">The more souls, the scarier the yield! 💀</p>
              </div>
            </footer>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
