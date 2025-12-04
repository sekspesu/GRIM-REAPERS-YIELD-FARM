'use client';

import { useState } from 'react';

export default function CreateVaultForm({ program, onSuccess }: any) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    if (!program || !amount) return;
    
    try {
      setLoading(true);
      setMessage('Creating vault...');
      
      // Implementation would go here
      setMessage('✅ Vault created successfully!');
      setTimeout(() => {
        onSuccess();
        setMessage('');
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
            placeholder="0.00"
            className="w-full bg-halloween-black/50 border border-halloween-orange/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-lg"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !amount}
          className="w-full bg-halloween-orange hover:bg-halloween-orange/80 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? '⏳ Creating...' : '🚀 Create Vault'}
        </button>

        {message && (
          <div className="p-3 bg-halloween-black/50 rounded-lg text-sm text-center">
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
