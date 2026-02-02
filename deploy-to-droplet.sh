#!/bin/bash

# Deploy to Digital Ocean droplet
SERVER_IP="143.110.129.9"
SERVER_USER="root"
REMOTE_DIR="/var/www/ai-verify"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🚀 Deploying to Digital Ocean Droplet"
echo "Server: ${SERVER_USER}@${SERVER_IP}"
echo "Remote Directory: ${REMOTE_DIR}"
echo ""

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
PACKAGE_NAME="ai-verify-deploy-${TIMESTAMP}.tar.gz"

tar -czf ${PACKAGE_NAME} \
  --exclude='node_modules' \
  --exclude='sessions/*.json' \
  --exclude='*.log' \
  --exclude='.git*' \
  --exclude='test-*.js' \
  --exclude='start-chatbot.js' \
  --exclude='session.json' \
  --exclude='test-session.json' \
  --exclude='*.sh' \
  --exclude='.env' \
  package.json \
  package-lock.json \
  server.js \
  terminal-server.js \
  lib/ \
  schemas/ \
  Dockerfile \
  captain-definition \
  docker-compose.yml \
  .dockerignore \
  *.md

if [ $? -ne 0 ]; then
    echo "❌ Failed to create package"
    exit 1
fi

echo "✅ Package created: ${PACKAGE_NAME}"
echo ""

# Step 2: Copy package to server
echo "📤 Uploading to server..."
scp ${PACKAGE_NAME} ${SERVER_USER}@${SERVER_IP}:/tmp/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload package"
    exit 1
fi

echo "✅ Package uploaded"
echo ""

# Step 3: Copy .env file
echo "📤 Uploading .env file..."
scp .env ${SERVER_USER}@${SERVER_IP}:/tmp/ai-verify.env

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Failed to upload .env file"
    echo "   You'll need to configure environment variables manually"
fi

echo ""

# Step 4: Extract and install on server
echo "🔧 Installing on server..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

# Create app directory
mkdir -p /var/www/ai-verify
cd /var/www/ai-verify

# Extract package
echo "Extracting package..."
tar -xzf /tmp/ai-verify-deploy-*.tar.gz

# Copy .env if exists
if [ -f /tmp/ai-verify.env ]; then
    cp /tmp/ai-verify.env .env
    chmod 600 .env
    echo "✓ Environment file configured"
fi

# Create sessions directory
mkdir -p sessions

# Install dependencies
echo "Installing dependencies..."
npm install --production

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

echo "✓ Installation complete"
ENDSSH

if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "🔧 Next steps on server:"
echo ""
echo "1. SSH into server:"
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo ""
echo "2. Start the chat server:"
echo "   cd ${REMOTE_DIR}"
echo "   pm2 start server.js --name ai-verify-chat"
echo ""
echo "3. Start the terminal server:"
echo "   pm2 start terminal-server.js --name ai-verify-terminal"
echo ""
echo "4. Save PM2 configuration:"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Check status:"
echo "   pm2 status"
echo ""
echo "6. View logs:"
echo "   pm2 logs ai-verify-chat"
echo "   pm2 logs ai-verify-terminal"
echo ""

# Cleanup
rm ${PACKAGE_NAME}
echo "🧹 Cleaned up local package"
echo ""
