#!/bin/bash

# Quick deployment script - deploys and starts services
SERVER_IP="143.110.129.9"
SERVER_USER="root"
REMOTE_DIR="/var/www/ai-verify"

echo "🚀 Quick Deploy & Start to ${SERVER_IP}"
echo ""

# Create and upload package
echo "📦 Creating package..."
tar -czf /tmp/ai-verify.tar.gz \
  --exclude='node_modules' \
  --exclude='sessions/*.json' \
  --exclude='*.log' \
  --exclude='.git*' \
  --exclude='test-*.js' \
  --exclude='start-chatbot.js' \
  --exclude='session.json' \
  --exclude='*.sh' \
  --exclude='.env' \
  package.json package-lock.json server.js terminal-server.js lib/ schemas/ *.md

echo "📤 Uploading..."
scp /tmp/ai-verify.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
scp .env ${SERVER_USER}@${SERVER_IP}:/tmp/ai-verify.env

echo "🔧 Deploying and starting services..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

# Setup directory
mkdir -p /var/www/ai-verify
cd /var/www/ai-verify

# Stop existing services
pm2 delete ai-verify-chat 2>/dev/null || true
pm2 delete ai-verify-terminal 2>/dev/null || true

# Extract and setup
tar -xzf /tmp/ai-verify.tar.gz
[ -f /tmp/ai-verify.env ] && cp /tmp/ai-verify.env .env && chmod 600 .env
mkdir -p sessions

# Install deps
npm install --production --quiet

# Install PM2 if needed
which pm2 >/dev/null || npm install -g pm2

# Start services
echo ""
echo "🚀 Starting services..."
pm2 start server.js --name ai-verify-chat
pm2 start terminal-server.js --name ai-verify-terminal

# Save PM2 config
pm2 save

echo ""
echo "✅ Services started!"
pm2 status

# Cleanup
rm /tmp/ai-verify.tar.gz /tmp/ai-verify.env 2>/dev/null || true
ENDSSH

# Local cleanup
rm /tmp/ai-verify.tar.gz

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
echo "📜 View logs: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs'"
echo ""
echo "🌐 Access servers:"
echo "   Chat API: http://${SERVER_IP}:3001"
echo "   Terminal API: http://${SERVER_IP}:3002"
echo ""
