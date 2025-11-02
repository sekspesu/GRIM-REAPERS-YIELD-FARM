/**
 * Dynamic APY Calculator
 * 
 * Helper functions to calculate the current APY based on total TVL.
 * This matches the on-chain calculation in the Rust program.
 * 
 * Can be used standalone or imported into your project.
 */

// Type alias for BN compatibility
type BNLike = { toNumber(): number } | number;

const SOL_LAMPORTS = 1_000_000_000; // 1 SOL = 1 billion lamports

/**
 * Calculate dynamic APY based on total TVL
 * 
 * APY Tiers:
 * - TVL >= 100,000 SOL => 15.0% APY
 * - TVL >= 50,000 SOL => 12.0% APY
 * - TVL >= 10,000 SOL => 8.0% APY
 * - TVL < 10,000 SOL => 5.0% APY
 * 
 * @param totalTvl - Total value locked in lamports
 * @returns APY as a percentage (e.g., 15.0)
 */
export function calculateDynamicApy(totalTvl: BNLike): number {
  const tvlNumber = typeof totalTvl === 'number' ? totalTvl : totalTvl.toNumber();
  const tvlInSol = tvlNumber / SOL_LAMPORTS;

  if (tvlInSol >= 100_000) {
    return 15.0;
  } else if (tvlInSol >= 50_000) {
    return 12.0;
  } else if (tvlInSol >= 10_000) {
    return 8.0;
  } else {
    return 5.0;
  }
}

/**
 * Calculate dynamic APY in basis points
 * 
 * @param totalTvl - Total value locked in lamports
 * @returns APY in basis points (e.g., 1500 for 15%)
 */
export function calculateDynamicApyBps(totalTvl: BNLike): number {
  const tvlNumber = typeof totalTvl === 'number' ? totalTvl : totalTvl.toNumber();
  const tvlInSol = tvlNumber / SOL_LAMPORTS;

  if (tvlInSol >= 100_000) {
    return 1500; // 15.0%
  } else if (tvlInSol >= 50_000) {
    return 1200; // 12.0%
  } else if (tvlInSol >= 10_000) {
    return 800; // 8.0%
  } else {
    return 500; // 5.0%
  }
}

/**
 * Get the APY tier description
 * 
 * @param totalTvl - Total value locked in lamports
 * @returns Description of the current APY tier
 */
export function getApyTierDescription(totalTvl: BNLike): string {
  const tvlNumber = typeof totalTvl === 'number' ? totalTvl : totalTvl.toNumber();
  const tvlInSol = tvlNumber / SOL_LAMPORTS;

  if (tvlInSol >= 100_000) {
    return "Maximum fear! The souls are overflowing 💀💀💀";
  } else if (tvlInSol >= 50_000) {
    return "High fear - souls are gathering 💀💀";
  } else if (tvlInSol >= 10_000) {
    return "Moderate fear - souls are accumulating 💀";
  } else {
    return "Base fear - just getting started 👻";
  }
}

/**
 * Calculate expected annual rewards
 * 
 * @param balance - Vault balance in lamports
 * @param totalTvl - Total value locked in lamports
 * @param hasReaperPass - Whether the user has a Reaper Pass (2x boost)
 * @returns Expected annual rewards in lamports
 */
export function calculateAnnualRewards(
  balance: BNLike,
  totalTvl: BNLike,
  hasReaperPass: boolean = false
): number {
  const balanceNumber = typeof balance === 'number' ? balance : balance.toNumber();
  const apyPercent = calculateDynamicApy(totalTvl);
  
  let rewards = balanceNumber * (apyPercent / 100);
  
  if (hasReaperPass) {
    rewards *= 2.0; // Reaper Pass provides 2x boost
  }
  
  return Math.floor(rewards);
}

/**
 * Calculate expected rewards for a given time period
 * 
 * @param balance - Vault balance in lamports
 * @param totalTvl - Total value locked in lamports
 * @param timeElapsedSeconds - Time elapsed in seconds
 * @param hasReaperPass - Whether the user has a Reaper Pass (2x boost)
 * @returns Expected rewards in lamports
 */
export function calculateRewards(
  balance: BNLike,
  totalTvl: BNLike,
  timeElapsedSeconds: number,
  hasReaperPass: boolean = false
): number {
  const balanceNumber = typeof balance === 'number' ? balance : balance.toNumber();
  const apyBps = calculateDynamicApyBps(totalTvl);
  
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
  const BASIS_POINTS = 10_000;
  
  // Calculate: (balance * apy_bps * time_elapsed) / (SECONDS_PER_YEAR * BASIS_POINTS)
  let rewards = (balanceNumber * apyBps * timeElapsedSeconds) / (SECONDS_PER_YEAR * BASIS_POINTS);
  
  if (hasReaperPass) {
    rewards *= 2.0; // Reaper Pass provides 2x boost
  }
  
  return Math.floor(rewards);
}

/**
 * Format TVL for display
 * 
 * @param totalTvl - Total value locked in lamports
 * @returns Formatted TVL string (e.g., "50,000 SOL")
 */
export function formatTvl(totalTvl: BNLike): string {
  const tvlNumber = typeof totalTvl === 'number' ? totalTvl : totalTvl.toNumber();
  const tvlInSol = tvlNumber / SOL_LAMPORTS;
  return `${tvlInSol.toLocaleString()} SOL`;
}

/**
 * Get APY tier information
 * 
 * @param totalTvl - Total value locked in lamports
 * @returns Object with APY tier information
 */
export function getApyTierInfo(totalTvl: BNLike): {
  apy: number;
  apyBps: number;
  tier: string;
  description: string;
  tvlInSol: number;
  nextTierTvl: number | null;
  nextTierApy: number | null;
} {
  const tvlNumber = typeof totalTvl === 'number' ? totalTvl : totalTvl.toNumber();
  const tvlInSol = tvlNumber / SOL_LAMPORTS;
  
  let tier: string;
  let nextTierTvl: number | null;
  let nextTierApy: number | null;
  
  if (tvlInSol >= 100_000) {
    tier = "Maximum";
    nextTierTvl = null;
    nextTierApy = null;
  } else if (tvlInSol >= 50_000) {
    tier = "High";
    nextTierTvl = 100_000;
    nextTierApy = 15.0;
  } else if (tvlInSol >= 10_000) {
    tier = "Moderate";
    nextTierTvl = 50_000;
    nextTierApy = 12.0;
  } else {
    tier = "Base";
    nextTierTvl = 10_000;
    nextTierApy = 8.0;
  }
  
  return {
    apy: calculateDynamicApy(totalTvl),
    apyBps: calculateDynamicApyBps(totalTvl),
    tier,
    description: getApyTierDescription(totalTvl),
    tvlInSol,
    nextTierTvl,
    nextTierApy,
  };
}

// Example usage (Node.js only)
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  // Example: Calculate APY for different TVL levels
  const examples = [
    5_000,    // 5,000 SOL
    15_000,   // 15,000 SOL
    75_000,   // 75,000 SOL
    150_000,  // 150,000 SOL
  ];
  
  console.log("Dynamic APY Calculator - Fear Index\n");
  console.log("=" .repeat(80));
  
  for (const tvlSol of examples) {
    const tvlLamports = tvlSol * SOL_LAMPORTS;
    const info = getApyTierInfo(tvlLamports);
    
    console.log(`\nTVL: ${tvlSol.toLocaleString()} SOL`);
    console.log(`Tier: ${info.tier}`);
    console.log(`APY: ${info.apy}%`);
    console.log(`Description: ${info.description}`);
    
    if (info.nextTierTvl) {
      const remaining = info.nextTierTvl - tvlSol;
      console.log(`Next tier: ${remaining.toLocaleString()} SOL away from ${info.nextTierApy}% APY`);
    } else {
      console.log(`Status: Maximum tier reached! 🎉`);
    }
    
    // Calculate example rewards for 1000 SOL deposit
    const depositSol = 1000;
    const depositLamports = depositSol * SOL_LAMPORTS;
    const annualRewards = calculateAnnualRewards(depositLamports, tvlLamports, false);
    const annualRewardsWithPass = calculateAnnualRewards(depositLamports, tvlLamports, true);
    
    console.log(`\nExample: ${depositSol} SOL deposit`);
    console.log(`  Annual rewards: ${(annualRewards / SOL_LAMPORTS).toFixed(2)} SOL`);
    console.log(`  With Reaper Pass: ${(annualRewardsWithPass / SOL_LAMPORTS).toFixed(2)} SOL`);
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("\nThe more souls, the scarier the yield! 💀\n");
}
