# Kiro Agent Hooks for Soul Harvest Vault

## Available Hooks

### 🌙 Midnight Reaper

**Type**: Manual trigger  
**Purpose**: Execute midnight harvest for all active vaults

**What it does**:
- Compounds rewards for all active vaults
- Applies 13% soul tax (tracked for burning)
- Sends 1% charity donation to Solana Foundation
- Adds remaining 86% to vault balances
- Updates soul harvest totals

**How to use**:
1. Open the Kiro Agent Hooks panel
2. Find "🌙 Midnight Reaper" hook
3. Click the button to execute

**Requirements**:
- Wallet with SOL for transaction fees
- Environment variables configured (ANCHOR_WALLET, ANCHOR_PROVIDER_URL)
- Active vaults in the program

**Recommended Schedule**: Daily at 00:00 UTC

## Setting Up Automated Execution

While Kiro hooks are great for manual testing, for production you'll want automated execution:

### Option 1: Cron Job (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add this line
0 0 * * * cd /path/to/soul-harvest-vault && npm run midnight-harvest
```

### Option 2: Windows Task Scheduler
Import the `windows-task-example.xml` file or create a task manually.

### Option 3: Cloud Scheduler
Use AWS EventBridge, Google Cloud Scheduler, or similar services.

See [MIDNIGHT_HARVEST.md](../../MIDNIGHT_HARVEST.md) for detailed setup instructions.

## Creating Custom Hooks

You can create additional hooks for other operations:

### Example: Test Vault Hook
```json
{
  "name": "Test Vault Creation",
  "description": "Create a test vault with sample tokens",
  "trigger": {
    "type": "manual",
    "label": "🧪 Create Test Vault"
  },
  "actions": [
    {
      "type": "command",
      "command": "anchor test --skip-build -- test_create_vault",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### Example: Leaderboard Query Hook
```json
{
  "name": "Query Leaderboard",
  "description": "Fetch and display current leaderboard rankings",
  "trigger": {
    "type": "manual",
    "label": "🏆 View Leaderboard"
  },
  "actions": [
    {
      "type": "command",
      "command": "ts-node scripts/query-leaderboard.ts",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

## Hook Configuration Reference

### Trigger Types
- `manual`: User clicks a button to execute
- `onSave`: Executes when a file is saved (requires filePattern)
- `onOpen`: Executes when a file is opened

### Action Types
- `command`: Execute a shell command
- `agent`: Trigger an agent execution with a prompt

### Variables
- `${workspaceFolder}`: Path to workspace root
- `${file}`: Current file path
- `${fileBasename}`: Current file name

## Best Practices

1. **Test First**: Always test hooks manually before automating
2. **Error Handling**: Include proper error handling in scripts
3. **Logging**: Log all executions for debugging
4. **Notifications**: Set up alerts for failures
5. **Rate Limiting**: Add delays between operations to avoid RPC limits

## Troubleshooting

### Hook doesn't appear
- Check JSON syntax in hook file
- Restart Kiro IDE
- Check the Agent Hooks panel

### Command fails
- Verify working directory is correct
- Check environment variables are set
- Run command manually to test
- Check logs for error messages

### Permission denied
- Make scripts executable: `chmod +x script.sh`
- Check file permissions
- Run as appropriate user

## Support

For issues with hooks, check:
1. Hook configuration JSON syntax
2. Command/script exists and is executable
3. Environment variables are set
4. Logs in `logs/` directory

For Solana program issues, see the main [README.md](../../README.md).
