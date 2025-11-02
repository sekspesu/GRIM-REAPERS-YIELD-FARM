#!/bin/bash
# Midnight Harvest Cron Job Example
# 
# This script is designed to be run by cron at midnight UTC daily.
# It executes the midnight harvest operation for all active vaults.
#
# Setup Instructions:
# 1. Make this script executable: chmod +x cron-example.sh
# 2. Edit crontab: crontab -e
# 3. Add this line: 0 0 * * * /path/to/soul-harvest-vault/cron-example.sh
#
# Cron Schedule Explanation:
# 0 0 * * * = At 00:00 (midnight) every day
# │ │ │ │ │
# │ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
# │ │ │ └───── Month (1-12)
# │ │ └─────── Day of month (1-31)
# │ └───────── Hour (0-23)
# └─────────── Minute (0-59)

# Change to project directory
cd "$(dirname "$0")"

# Load environment variables
export ANCHOR_WALLET="${HOME}/.config/solana/id.json"
export ANCHOR_PROVIDER_URL="https://api.mainnet-beta.solana.com"

# Create logs directory if it doesn't exist
mkdir -p logs

# Log start time
echo "==================================" >> logs/midnight-harvest.log
echo "Starting Midnight Harvest: $(date -u)" >> logs/midnight-harvest.log

# Execute midnight harvest
npm run midnight-harvest >> logs/midnight-harvest.log 2>&1

# Log completion
echo "Completed: $(date -u)" >> logs/midnight-harvest.log
echo "==================================" >> logs/midnight-harvest.log

# Optional: Send notification on failure
if [ $? -ne 0 ]; then
    echo "Midnight Harvest failed at $(date -u)" | mail -s "Midnight Harvest Failed" admin@example.com
fi
