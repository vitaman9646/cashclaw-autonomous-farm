# 🤖 CashClaw Autonomous Farm

**Fully autonomous AI freelancer farm that scales, optimizes, and profits automatically.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

## 🎯 What is This?

An **autonomous AI agent farm** that:

- 🤖 **Works 24/7** - Monitors marketplaces, bids on tasks, completes work
- 📈 **Self-scales** - Automatically clones successful agents
- ⚡ **Self-optimizes** - Adjusts pricing, strategies, and removes underperformers
- 💰 **Auto-withdraws** - Sends profits to your wallet automatically
- 🔍 **Discovers niches** - Finds new profitable categories
- 🌐 **Expands markets** - Integrates new marketplaces when profitable
- 📊 **Reports to Telegram** - Daily updates and approval requests

**You just monitor Telegram, add funds to API, and expand VPS when needed.**

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- OpenRouter API key ([get here](https://openrouter.ai))
- Telegram bot ([create with BotFather](https://t.me/BotFather))
- VPS (Aeza/Hetzner/DigitalOcean recommended)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/cashclaw-autonomous-farm.git
cd cashclaw-autonomous-farm

# 2. Run setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 4. Test configuration
npm test

# 5. Start agents
npm start
