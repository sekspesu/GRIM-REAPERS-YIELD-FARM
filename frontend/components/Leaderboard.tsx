'use client';

import { useState, useEffect } from 'react';

export default function Leaderboard({ program }: any) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [program]);

  const loadLeaderboard = async () => {
    if (!program) return;
    
    try {
      // Fetch all leaderboard entries
      const entries = await program.account.leaderboardEntry.all();
      
      // Sort by TVL descending
      const sorted = entries
        .map((entry: any) => ({
          user: entry.account.user.toString(),
          tvl: entry.account.tvl.toNumber() / 1_000_000_000,
        }))
        .sort((a: any, b: any) => b.tvl - a.tvl)
        .slice(0, 10);
      
      setLeaders(sorted);
    } catch (err) {
      console.log('Error loading leaderboard:', err);
      // Mock data for demo
      setLeaders([
        { user: 'Demo...User1', tvl: 1000.5 },
        { user: 'Demo...User2', tvl: 750.2 },
        { user: 'Demo...User3', tvl: 500.8 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-halloween-purple/20 border border-halloween-orange/30 rounded-lg p-6 backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-halloween-orange mb-6 flex items-center gap-2">
        <span>🏆</span> Leaderboard
      </h2>
      
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          Loading leaderboard...
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">👻</div>
          <p>No souls harvested yet</p>
          <p className="text-xs mt-2">Be the first to create a vault!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader, index) => (
            <div
              key={index}
              className="bg-halloween-black/50 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`text-2xl ${index === 0 ? 'skull-glow' : ''}`}>
                  {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💀'}
                </div>
                <div>
                  <p className="font-mono text-sm text-gray-400">
                    {leader.user.slice(0, 4)}...{leader.user.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-600">Rank #{index + 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{leader.tvl.toFixed(2)}</p>
                <p className="text-xs text-gray-500">SOL</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-6 border-t border-halloween-orange/20 text-center">
        <p className="text-xs text-gray-500">
          Compete for the top spot and harvest more souls! 💀
        </p>
      </div>
    </div>
  );
}
