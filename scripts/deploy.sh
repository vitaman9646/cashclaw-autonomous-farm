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
echo "║     🚀 DEPLOYMENT SCRIPT                   ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ============================================
# LOAD ENVIRONMENT
# ============================================

if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create .env file first (copy from .env.example)"
    exit 1
fi

source .env

# ============================================
# CHECK REQUIRED VARIABLES
# ============================================

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}❌ SERVER_IP not set in .env${NC}"
    exit 1
fi

if [ -z "$SSH_USER" ]; then
    echo -e "${YELLOW}⚠️  SSH_USER not set, using 'root'${NC}"
    SSH_USER="root"
fi

SSH_PORT=${SSH_PORT:-22}

echo "Deployment configuration:"
echo "  Server: $SSH_USER@$SERVER_IP:$SSH_PORT"
echo ""

# ============================================
# CHECK SSH CONNECTION
# ============================================

echo "🔍 Testing SSH connection..."

if ! ssh -p $SSH_PORT -o ConnectTimeout=10 $SSH_USER@$SERVER_IP "echo 'SSH OK'" &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to server${NC}"
    echo "Please check:"
    echo "  - SERVER_IP is correct"
    echo "  - SSH key is configured"
    echo "  - Firewall allows SSH"
    exit 1
fi

echo -e "${GREEN}✅ SSH connection OK${NC}"
echo ""

# ============================================
# CREATE DEPLOYMENT PACKAGE
# ============================================

echo "📦 Creating deployment package..."

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_FILE="deploy_${TIMESTAMP}.tar.gz"

tar -czf $DEPLOY_FILE \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    --exclude=analytics \
    --exclude=.env \
    --exclude=agents/**/.wallet.json \
    --exclude=agents/**/.cashclaw \
    --exclude=*.log \
    --exclude=deploy_*.tar.gz \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Package created: $DEPLOY_FILE${NC}"
else
    echo -e "${RED}❌ Failed to create package${NC}"
    exit 1
fi

echo ""

# ============================================
# UPLOAD TO SERVER
# ============================================

echo "⬆️  Uploading to server..."

scp -P $SSH_PORT $DEPLOY_FILE $SSH_USER@$SERVER_IP:/tmp/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload complete${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    rm $DEPLOY_FILE
    exit 1
fi

echo ""

# ============================================
# DEPLOY ON SERVER
# ============================================

echo "🔧 Deploying on server..."

ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << ENDSSH
    set -e
    
    echo "Setting up environment..."
    
    # Create project directory if not exists
    if [ ! -d "cashclaw-farm" ]; then
        mkdir -p cashclaw-farm
        echo "Created cashclaw-farm directory"
    fi
    
    cd cashclaw-farm
    
    # Backup current version
    if [ -d "lib" ]; then
        BACKUP_DIR="backup_${TIMESTAMP}"
        mkdir -p ../\$BACKUP_DIR
        cp -r . ../\$BACKUP_DIR/
        echo "Backed up to ../\$BACKUP_DIR"
    fi
    
    # Extract new version
    echo "Extracting deployment package..."
    tar -xzf /tmp/$DEPLOY_FILE
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install --production
    
    # Install global packages if needed
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        npm install -g pm2
    fi
    
    # Stop old processes
    echo "Stopping old processes..."
    pm2 stop all 2>/dev/null || true
    
    # Start new version
    echo "Starting new version..."
    pm2 start ecosystem.config.js
    
    # Save PM2 config
    pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER 2>/dev/null || true
    
    # Cleanup
    rm /tmp/$DEPLOY_FILE
    
    echo "Deployment complete!"
    
    # Show status
    pm2 status
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    rm $DEPLOY_FILE
    exit 1
fi

echo ""

# ============================================
# CLEANUP LOCAL
# ============================================

rm $DEPLOY_FILE

# ============================================
# FINAL STATUS
# ============================================

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ✅ DEPLOYMENT COMPLETE                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Check status:"
echo "   ${YELLOW}ssh $SSH_USER@$SERVER_IP 'pm2 status'${NC}"
echo ""
echo "2. View logs:"
echo "   ${YELLOW}ssh $SSH_USER@$SERVER_IP 'pm2 logs'${NC}"
echo ""
echo "3. Monitor:"
echo "   ${YELLOW}ssh $SSH_USER@$SERVER_IP 'cd cashclaw-farm && npm run monitor'${NC}"
echo ""
