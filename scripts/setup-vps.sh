#!/bin/bash

VPS_IP="${1}"
VPS_USER="root"

if [ -z "$VPS_IP" ]; then
  echo "Usage: ./scripts/setup-vps.sh YOUR_VPS_IP"
  exit 1
fi

echo "🚀 Setting up VPS at ${VPS_IP}..."

ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e

echo "📦 Updating system..."
apt update && apt upgrade -y

echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "📦 Installing Git..."
apt install -y git

echo "📦 Installing PM2..."
npm install -g pm2

echo "📦 Setting up firewall..."
ufw allow 22/tcp
ufw --force enable

echo "📦 Installing fail2ban..."
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo ""
echo "✅ VPS setup complete!"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"

ENDSSH

echo ""
echo "✅ VPS is ready!"
