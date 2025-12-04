'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

export default function WalletConnectionTest() {
  const { publicKey, connected, connecting, wallet } = useWallet();

  useEffect(() => {
    console.log('Wallet State:', {
      connected,
      connecting,
      publicKey: publicKey?.toString(),
      wallet: wallet?.adapter.name,
    });
  }, [connected, connecting, publicKey, wallet]);

  return (
    <div className="bg-halloween-black/50 border border-halloween-orange/30 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-halloween-orange mb-4">🔍 Wallet Debug</h3>
      <div className="space-y-2 text-sm font-mono">
        <p>Connected: {connected ? '✅ Yes' : '❌ No'}</p>
        <p>Connecting: {connecting ? '⏳ Yes' : '❌ No'}</p>
        <p>Wallet: {wallet?.adapter.name || 'None'}</p>
        <p>Address: {publicKey ? publicKey.toString().slice(0, 8) + '...' : 'Not connected'}</p>
      </div>
    </div>
  );
}
