/**
 * Dynamic APY Calculator (JavaScript version)
 * 
 * Helper functions to calculate the current APY based on total TVL.
 * This matches the on-chain calculation in the Rust program.
 */

const SOL_LAMPORTS = 1_000_000_000; // 1 SOL = 1 billion lamports

/**
 * Calculate dynamic APY based on total TVL
 * 
 * @param {number} totalTvl - Total value locked in lamports
 * @returns {number} APY as a percentage (e.g., 15.0)
 */
function calculateDynamicApy(totalTvl) {
  const tvlInSol = totalTvl / SOL_LAMPORTS;

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
 * Get the APY tier description
 * 
 * @param {number} totalTvl - Total value locked in lamports
 * @returns {string} Description of the current APY tier
 */
function getApyTierDescription(totalTvl) {
  const tvlInSol = totalTvl / SOL_LAMPORTS;

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
 * Get APY tier information
 * 
 * @param {number} totalTvl - Total value locked in lamports
 * @returns {object} Object with APY tier information
 */
function getApyTierInfo(totalTvl) {
  const tvlInSol = totalTvl / SOL_LAMPORTS;
  
  let tier;
  let nextTierTvl;
  let nextTierApy;
  
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
    tier,
    description: getApyTierDescription(totalTvl),
    tvlInSol,
    nextTierTvl,
    nextTierApy,
  };
}

/**
 * Calculate expected annual rewards
 * 
 * @param {number} balance - Vault balance in lamports
 * @param {number} totalTvl - Total value locked in lamports
 * @param {boolean} hasReaperPass - Whether the user has a Reaper Pass (2x boost)
 * @returns {number} Expected annual rewards in lamports
 */
function calculateAnnualRewards(balance, totalTvl, hasReaperPass = false) {
  const apyPercent = calculateDynamicApy(totalTvl);
  
  let rewards = balance * (apyPercent / 100);
  
  if (hasReaperPass) {
    rewards *= 2.0; // Reaper Pass provides 2x boost
  }
  
  return Math.floor(rewards);
}

// Example usage
if (require.main === module) {
  const examples = [
    5_000,    // 5,000 SOL
    15_000,   // 15,000 SOL
    75_000,   // 75,000 SOL
    150_000,  // 150,000 SOL
  ];
  
  console.log("Dynamic APY Calculator - Fear Index\n");
  console.log("=".repeat(80));
  
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

module.exports = {
  calculateDynamicApy,
  getApyTierDescription,
  getApyTierInfo,
  calculateAnnualRewards,
  SOL_LAMPORTS,
};
