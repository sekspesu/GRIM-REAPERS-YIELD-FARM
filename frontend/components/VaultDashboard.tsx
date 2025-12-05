'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import APYDisplay from './APYDisplay';
import VaultCard from './VaultCard';
import CreateVaultForm from './CreateVaultForm';
import Leaderboard from './Leaderboard';

const PROGRAM_ID = new PublicKey('CM7bjZs41G4ryhjUMptVRLLd1ojwxHrrE5sGfEGqV5h');

export default function VaultDashboard() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [program, setProgram] = useState<anchor.Program | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [vault, setVault] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet.publicKey && wallet.signTransaction) {
      const provider = new anchor.AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );
      
      // Load IDL from file
      fetch('/idl/soul_harvest_vault.json')
        .then(res => res.json())
        .then(idl => {
          try {
            // New Anchor 0.30+ format - IDL contains address
            const prog = new anchor.Program(idl, provider);
            setProgram(prog);
            loadConfig(prog);
          } catch (err) {
            console.error('Failed to create program:', err);
            // Set demo config for UI display
            setConfig({
              baseApy: 500,
              totalTvl: { toNumber: () => 0 },
              reaperBoost: 20000,
            });
          }
        })
        .catch(err => console.error('Failed to load IDL:', err));
    }
  }, [wallet.publicKey, connection]);

  const loadConfig = async (prog: anchor.Program) => {
    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        PROGRAM_ID
      );
      
      const configAccount = await (prog.account as any).vaultConfig.fetch(configPda);
      setConfig(configAccount);
    } catch (err) {
      console.log('Config not initialized yet');
    }
  };

  const loadVault = async () => {
    if (!program || !wallet.publicKey) return;
    
    try {
      setLoading(true);
      // For demo, we'll use a mock token mint
      // In production, user would select which token to view
      const mockTokenMint = new PublicKey('So11111111111111111111111111111111111111112');
      
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('vault'),
          wallet.publicKey.toBuffer(),
          mockTokenMint.toBuffer(),
        ],
        PROGRAM_ID
      );
      
      const vaultAccount = await (program.account as any).vault.fetch(vaultPda);
      setVault(vaultAccount);
    } catch (err) {
      console.log('No vault found');
      setVault(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (program && wallet.publicKey) {
      loadVault();
    }
  }, [program, wallet.publicKey]);

  if (!wallet.connected) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-6 skull-glow">👻</div>
        <h2 className="text-3xl font-bold mb-4 text-halloween-orange">
          Connect Your Wallet
        </h2>
        <p className="text-gray-400">
          Connect your wallet to start harvesting souls and earning yield
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* APY Display */}
      <APYDisplay config={config} />

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Vault */}
        <div className="space-y-6">
          {vault ? (
            <VaultCard 
              vault={vault} 
              program={program} 
              onUpdate={loadVault}
            />
          ) : (
            <CreateVaultForm 
              program={program} 
              onSuccess={loadVault}
            />
          )}
        </div>

        {/* Right Column - Leaderboard */}
        <div>
          <Leaderboard program={program} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <InfoCard
          icon="💀"
          title="Soul Harvesting"
          description="Earn souls based on your compounded rewards. The more you compound, the more souls you harvest!"
        />
        <InfoCard
          icon="🔥"
          title="Dynamic APY"
          description="APY increases from 5% to 15% as total TVL grows. Early adopters benefit as more users join!"
        />
        <InfoCard
          icon="🌙"
          title="Midnight Harvest"
          description="Automated daily compounding at midnight with 13% soul tax and 1% charity donation."
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-halloween-purple/20 border border-halloween-orange/30 rounded-lg p-6 backdrop-blur-sm">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-halloween-orange mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
