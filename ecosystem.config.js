---

## `ecosystem.config.js`

```javascript
require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * PM2 Ecosystem Configuration
 * Dynamically loads agents from config/agents.json
 */

function loadAgents() {
  const configPath = path.join(__dirname, 'config/agents.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ config/agents.json not found');
    console.log('Run: npm run setup');
    process.exit(1);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.agents.filter(agent => agent.enabled);
}

const enabledAgents = loadAgents();

const apps = enabledAgents.map(agent => ({
  name: agent.name,
  script: path.join(__dirname, 'agents/core-agent.js'),
  args: agent.name,
  cwd: __dirname,
  env: {
    AGENT_NAME: agent.name,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    MAIN_WALLET_ADDRESS: process.env.MAIN_WALLET_ADDRESS,
    NODE_ENV: process.env.NODE_ENV || 'production',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
  },
  instances: 1,
  exec_mode: 'fork',
  max_memory_restart: '500M',
  error_file: path.join(__dirname, `logs/${agent.name}-error.log`),
  out_file: path.join(__dirname, `logs/${agent.name}-out.log`),
  time: true,
  autorestart: true,
  watch: false,
  max_restarts: 10,
  min_uptime: '10s'
}));

// Add orchestrator (runs once daily)
apps.push({
  name: 'orchestrator',
  script: path.join(__dirname, 'lib/autonomous-orchestrator.js'),
  cwd: __dirname,
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    MAIN_WALLET_ADDRESS: process.env.MAIN_WALLET_ADDRESS,
    NODE_ENV: process.env.NODE_ENV || 'production'
  },
  cron_restart: '0 3 * * *',  // Run at 3:00 AM daily
  autorestart: false,
  watch: false
});

module.exports = { apps };

apps.push({
  name: 'webhook-server',
  script: './lib/webhook-server.js',
  env: {
    PORT: 3000
  }
});
