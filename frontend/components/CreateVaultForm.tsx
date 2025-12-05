'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, NATIVE_MINT, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createSyncNativeInstruction } from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';

const PROGRAM_ID = new PublicKey('CM7bjZs41G4ryhjUMptVRLLd1ojwxHrrE5sGfEGqV5h');

export default function CreateVaultForm({ program, onSuccess }: any) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    if (!program || !amount || !publicKey) {
      setMessage('❌ Please connect wallet and enter amount');
      return;
    }
    
    try {
      setLoading(true);
      setMessage('🔄 Creating vault on Solana...');

      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        setMessage('❌ Please enter a valid amount');
        setLoading(false);
        return;
      }

      const lamports = Math.floor(depositAmount * LAMPORTS_PER_SOL);
      
      // Use wrapped SOL (NATIVE_MINT) as the token
      const tokenMint = NATIVE_MINT;

      // Derive PDAs
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        PROGRAM_ID
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), publicKey.toBuffer(), tokenMint.toBuffer()],
        PROGRAM_ID
      );

      const [leaderboardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('leaderboard'), publicKey.toBuffer()],
        PROGRAM_ID
      );

      // Get or create user's wrapped SOL account
      const ownerTokenAccount = await getAssociatedTokenAddress(tokenMint, publicKey);
      
      // Generate a new keypair for the vault token account
      const vaultTokenAccount = Keypair.generate();

      setMessage('🔄 Preparing transaction...');

      // Build transaction
      const tx = await program.methods
        .createVault(new anchor.BN(lamports))
        .accounts({
          vault: vaultPda,
          leaderboardEntry: leaderboardPda,
          config: configPda,
          owner: publicKey,
          tokenMint: tokenMint,
          ownerTokenAccount: ownerTokenAccount,
          vaultTokenAccount: vaultTokenAccount.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([vaultTokenAccount])
        .transaction();

      setMessage('🔄 Please approve the transaction...');
      
      const signature = await sendTransaction(tx, connection, {
        signers: [vaultTokenAccount],
      });

      setMessage('🔄 Confirming transaction...');
      await connection.confirmTransaction(signature, 'confirmed');

      setMessage('✅ Vault created successfully! 🎃');
      setTimeout(() => {
        onSuccess();
        setMessage('');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating vault:', err);
      setMessage('❌ Error: ' + (err.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-halloween-purple/20 border border-halloween-orange/30 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-halloween-orange mb-6 flex items-center gap-2">
        <span>🎃</span> Create Your Vault
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Initial Deposit (SOL)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            step="0.01"
            min="0.01"
            className="w-full bg-halloween-black/50 border border-halloween-orange/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum: 0.01 SOL</p>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !amount || !publicKey}
          className="w-full bg-halloween-orange hover:bg-halloween-orange/80 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? '⏳ Creating...' : '🚀 Create Vault'}
        </button>

        {message && (
          <div className={`p-3 rounded-lg text-sm text-center ${
            message.includes('❌') ? 'bg-red-900/50' : 
            message.includes('✅') ? 'bg-green-900/50' : 
            'bg-halloween-black/50'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-halloween-orange/20 space-y-2 text-xs text-gray-500">
        <p>✅ Start earning dynamic APY immediately</p>
        <p>✅ Compound anytime to harvest souls</p>
        <p>✅ Withdraw anytime, no lock period</p>
      </div>
    </div>
  );
}
