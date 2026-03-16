#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║   🤖 CashClaw Autonomous Farm Setup       ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ============================================
# CHECK PREREQUISITES
# ============================================

echo "🔍 Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install Node.js >= 18 from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version too old (found v$NODE_VERSION)${NC}"
    echo "Please upgrade to Node.js >= 18"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# ============================================
# INSTALL DEPENDENCIES
# ============================================

echo ""
echo "📦 Installing dependencies..."
npm install

# ============================================
# INSTALL GLOBAL PACKAGES
# ============================================

echo ""
echo "📦 Installing global packages..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
else
    echo -e "${GREEN}✅ PM2 already installed${NC}"
fi

# ============================================
# CREATE DIRECTORY STRUCTURE
# ============================================

echo ""
echo "📁 Creating directory structure..."

mkdir -p agents
mkdir -p analytics
mkdir -p logs
mkdir -p adapters
mkdir -p docs

echo -e "${GREEN}✅ Directories created${NC}"

# ============================================
# SETUP ENVIRONMENT
# ============================================

echo ""
echo "📝 Setting up environment..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  .env file created${NC}"
    echo -e "${YELLOW}   Please edit .env and add your API keys${NC}"
else
    echo -e "${YELLOW}⚠️  .env already exists, skipping${NC}"
fi

# ============================================
# INITIALIZE CONFIGS
# ============================================

echo ""
echo "⚙️  Initializing configurations..."

# Create default agents.json if not exists
if [ ! -f config/agents.json ]; then
    cat > config/agents.json << 'EOF'
{
  "agents": [
    {
      "name": "agent-writer",
      "enabled": true,
      "description": "Content writing specialist",
      "specialties": [
        "content writing",
        "blog posts",
        "articles"
      ],
      "llm": {
        "provider": "openrouter",
        "model": "anthropic/claude-sonnet-4",
        "autoRoute": true,
        "maxTokens": 4000,
        "temperature": 0.7
      },
      "pricing": {
        "minPrice": 0.001,
        "maxPrice": 0.05,
        "strategy": "competitive"
      },
      "bidding": {
        "enabled": true,
        "maxConcurrentBids": 3,
        "maxCompetitors": 8,
        "minProfitMargin": 2.5,
        "responseTimeTarget": 30
      },
      "qualityControl": {
        "selfReview": true,
        "externalReview": false,
        "minQualityScore": 7
      }
    },
    {
      "name": "agent-coder",
      "enabled": false,
      "description": "Code review and TypeScript specialist",
      "specialties": [
        "typescript",
        "code review",
        "javascript"
      ],
      "llm": {
        "provider": "openrouter",
        "model": "anthropic/claude-sonnet-4",
        "autoRoute": false,
        "maxTokens": 8000,
        "temperature": 0.3
      },
      "pricing": {
        "minPrice": 0.01,
        "maxPrice": 0.1,
        "strategy": "premium"
      },
      "bidding": {
        "enabled": true,
        "maxConcurrentBids": 2,
        "maxCompetitors": 5,
        "minProfitMargin": 3.0,
        "responseTimeTarget": 60
      },
      "qualityControl": {
        "selfReview": true,
        "externalReview": true,
        "minQualityScore": 8
      }
    }
  ]
}
EOF
    echo -e "${GREEN}✅ Created config/agents.json${NC}"
else
    echo -e "${GREEN}✅ config/agents.json exists${NC}"
fi

# Create autonomous.json if not exists
if [ ! -f config/autonomous.json ]; then
    node lib/autonomous-orchestrator.js --init-config 2>/dev/null || echo "Will be created on first run"
fi

# ============================================
# INITIALIZE ANALYTICS
# ============================================

echo ""
echo "📊 Initializing analytics..."

if [ ! -f analytics/stats.json ]; then
    cat > analytics/stats.json << 'EOF'
{
  "quotesSubmitted": 0,
  "tasksWon": 0,
  "tasksLost": 0,
  "tasksCompleted": 0,
  "totalEarned": 0,
  "totalSpent": 0,
  "byAgent": {},
  "byCategory": {},
  "byStrategy": {},
  "timeline": []
}
EOF
    echo -e "${GREEN}✅ Created analytics/stats.json${NC}"
fi

# ============================================
# SETUP PM2
# ============================================

echo ""
echo "⚙️  Configuring PM2..."

pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 10M 2>/dev/null || true
pm2 set pm2-logrotate:retain 7 2>/dev/null || true

echo -e "${GREEN}✅ PM2 configured${NC}"

# ============================================
# MAKE SCRIPTS EXECUTABLE
# ============================================

echo ""
echo "🔧 Making scripts executable..."

chmod +x scripts/*.sh 2>/dev/null || true
chmod +x scripts/*.js 2>/dev/null || true
chmod +x test/*.sh 2>/dev/null || true

echo -e "${GREEN}✅ Scripts executable${NC}"

# ============================================
# FINAL INSTRUCTIONS
# ============================================

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           ✅ SETUP COMPLETE                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file:"
echo "   ${YELLOW}nano .env${NC}"
echo "   Add your API keys:"
echo "   - OPENROUTER_API_KEY"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - TELEGRAM_CHAT_ID"
echo ""
echo "2. Configure agents:"
echo "   ${YELLOW}nano config/agents.json${NC}"
echo ""
echo "3. Test configuration:"
echo "   ${YELLOW}npm test${NC}"
echo ""
echo "4. Start agents:"
echo "   ${YELLOW}npm start${NC}"
echo ""
echo "5. Monitor:"
echo "   ${YELLOW}npm run monitor${NC}"
echo ""
echo "Useful commands:"
echo "  npm start          - Start all agents"
echo "  npm stop           - Stop all agents"
echo "  npm run logs       - View logs"
echo "  npm run monitor    - Real-time monitoring"
echo "  npm run control    - Master control panel"
echo ""
echo "Documentation: docs/SETUP.md"
echo ""
