'use client';

export default function APYDisplay({ config }: { config: any }) {
  const calculateAPY = () => {
    if (!config) return { apy: 5.0, emoji: '👻', level: 'Base Fear' };
    
    const tvl = config.totalTvl.toNumber() / 1_000_000_000; // Convert to SOL
    
    if (tvl >= 100_000) {
      return { apy: 15.0, emoji: '💀💀💀', level: 'Maximum Fear' };
    } else if (tvl >= 50_000) {
      return { apy: 12.0, emoji: '💀💀', level: 'High Fear' };
    } else if (tvl >= 10_000) {
      return { apy: 8.0, emoji: '💀', level: 'Moderate Fear' };
    } else {
      return { apy: 5.0, emoji: '👻', level: 'Base Fear' };
    }
  };

  const { apy, emoji, level } = calculateAPY();
  const tvl = config ? (config.totalTvl.toNumber() / 1_000_000_000).toFixed(2) : '0.00';

  return (
    <div className="bg-gradient-to-r from-halloween-purple/40 to-halloween-orange/40 border-2 border-halloween-orange rounded-xl p-8 backdrop-blur-sm">
      <div className="text-center">
        <div className="text-6xl mb-4 skull-glow">{emoji}</div>
        <h2 className="text-5xl font-bold glow text-halloween-orange mb-2">
          {apy}% APY
        </h2>
        <p className="text-xl text-gray-300 mb-4">{level}</p>
        <div className="flex justify-center gap-8 text-sm">
          <div>
            <p className="text-gray-400">Total TVL</p>
            <p className="text-2xl font-bold text-white">{tvl} SOL</p>
          </div>
          <div>
            <p className="text-gray-400">Next Tier</p>
            <p className="text-2xl font-bold text-halloween-green">
              {tvl < '10000' ? '10K SOL' : tvl < '50000' ? '50K SOL' : tvl < '100000' ? '100K SOL' : 'MAX'}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          The more souls locked, the scarier the yield! 💀
        </p>
      </div>
    </div>
  );
}
