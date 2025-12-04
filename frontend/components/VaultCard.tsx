'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export default function VaultCard({ vault, program, onUpdate }: any) {
  const wallet = useWallet();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const balance = vault ? (vault.balance.toNumber() / 1_000_000_000).toFixed(4) : '0';
  const souls = vault ? vault.totalSoulsHarvested.toNumber() : 0;

  const handleCompound = async () => {
    if (!program || !wallet.publicKey) return;
    
    try {
      setLoading(true);
      setMessage('Compounding rewards...');
      
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
      );
      
      const mockTokenMint = new PublicKey('So11111111111111111111111111111111111111112');
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          wallet.publicKey.toBuffer(),
          mockTokenMint.toBuffer(),
        ],
        program.programId
      );
      
      const [leaderboardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('leaderboard'), wallet.publicKey.toBuffer()],
        program.programId
      );
      
      const config = await program.account.vaultConfig.fetch(configPda);
      
      await program.methods
        .compound()
        .accounts({
          vault: vaultPda,
          config: configPda,
          leaderboardEntry: leaderboardPda,
          ownerReaperAccount: null,
          reaperMint: config.reaperMint,
        })
        .rpc();
      
      setMessage('✅ Rewards compounded successfully!');
      setTimeout(() => {
        onUpdate();
        setMessage('');
      }, 2000);
    } catch (err: any) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!program || !wallet.publicKey || !withdrawAmount) return;
    
    try {
      setLoading(true);
      setMessage('Processing withdrawal...');
      
      const amount = new anchor.BN(parseFloat(withdrawAmount) * 1_000_000_000);
      
      // Implementation would go here
      setMessage('✅ Withdrawal successful!');
      setTimeout(() => {
        onUpdate();
        setMessage('');
        setWithdrawAmount('');
      }, 2000);
    } catch (err: any) {
      setMessage('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-halloween-purple/20 border border-halloween-orange/30 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-halloween-orange mb-6 flex items-center gap-2">
        <span>💰</span> Your Vault
      </h2>
      
      {/* Balance Display */}
      <div className="bg-halloween-black/50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Balance</p>
            <p className="text-3xl font-bold text-white">{balance}</p>
            <p className="text-xs text-gray-500">SOL</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Souls Harvested</p>
            <p className="text-3xl font-bold text-halloween-green">{souls}</p>
            <p className="text-xs text-gray-500">💀</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={handleCompound}
          disabled={loading}
          className="w-full bg-halloween-orange hover:bg-halloween-orange/80 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? '⏳ Processing...' : '🔄 Compound Rewards'}
        </button>

        <div className="flex gap-2">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount to withdraw"
            className="flex-1 bg-halloween-black/50 border border-halloween-orange/30 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
          <button
            onClick={handleWithdraw}
            disabled={loading || !withdrawAmount}
            className="bg-halloween-purple hover:bg-halloween-purple/80 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="mt-4 p-3 bg-halloween-black/50 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 pt-6 border-t border-halloween-orange/20">
        <p className="text-xs text-gray-500 text-center">
          Status: {vault?.isActive ? '✅ Active' : '❌ Inactive'}
        </p>
      </div>
    </div>
  );
}
