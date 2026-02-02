#!/bin/bash

# Deploy using HTTPS GitHub URL (no SSH keys needed on server)

SERVER_IP="143.110.129.9"
SERVER_USER="root"
REMOTE_DIR="/var/www/ai-verify"
REPO_URL="https://github.com/codenlighten/boundless-ai.git"

echo "🚀 Deploying from GitHub (HTTPS) to server"
echo "Server: ${SERVER_IP}"
echo "Repo: ${REPO_URL}"
echo ""

# Ensure local changes are pushed
echo "Checking if local changes are pushed..."
if ! git diff-index --quiet HEAD --; then
    echo "Pushing changes to GitHub..."
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || true
    git push origin main
fi

# Upload .env file
echo ""
echo "📤 Uploading .env file..."
scp -o ConnectTimeout=10 .env ${SERVER_USER}@${SERVER_IP}:/tmp/ai-verify.env

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Could not upload .env file via SCP"
    ENV_UPLOAD_FAILED=1
fi

echo ""
echo "🔧 Deploying on server..."

# Build deployment script
DEPLOY_SCRIPT=$(cat << 'ENDSSH'
set -e

# Install system dependencies
echo "Installing system dependencies..."
which git >/dev/null || (apt-get update && apt-get install -y git)
which node >/dev/null || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)
which pm2 >/dev/null || npm install -g pm2

# Clone or update repository (using HTTPS)
if [ -d /var/www/ai-verify/.git ]; then
  echo "Updating existing repository..."
  cd /var/www/ai-verify
  git pull origin main
else
  echo "Cloning repository..."
  mkdir -p /var/www
  git clone https://github.com/codenlighten/boundless-ai.git /var/www/ai-verify
  cd /var/www/ai-verify
fi

ENDSSH
)

# Add .env configuration
if [ ! -z "$ENV_UPLOAD_FAILED" ]; then
    DEPLOY_SCRIPT+=$(cat << EOF

# Configure environment
cat > .env << 'ENVEOF'
$(cat .env)
ENVEOF
chmod 600 .env

EOF
)
else
    DEPLOY_SCRIPT+=$(cat << 'ENDSSH'

# Use uploaded .env
cp /tmp/ai-verify.env .env
chmod 600 .env
rm /tmp/ai-verify.env

ENDSSH
)
fi

# Complete deployment
DEPLOY_SCRIPT+=$(cat << 'ENDSSH'

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

# Create sessions directory
mkdir -p sessions

# Restart services with PM2
echo "Restarting services..."
pm2 delete ai-verify-chat 2>/dev/null || true
pm2 delete ai-verify-terminal 2>/dev/null || true

pm2 start server.js --name ai-verify-chat
pm2 start terminal-server.js --name ai-verify-terminal

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true

echo ""
echo "✅ Deployment complete!"
pm2 status

ENDSSH
)

# Execute deployment
ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "$DEPLOY_SCRIPT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Services:"
    echo "   Chat API: http://${SERVER_IP}:3001"
    echo "   Terminal API: http://${SERVER_IP}:3002"
    echo ""
    echo "📊 Check status: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
    echo "📜 View logs:"
    echo "   ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs ai-verify-chat'"
    echo "   ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs ai-verify-terminal'"
    echo ""
    echo "🧪 Test endpoints:"
    echo "   curl http://${SERVER_IP}:3001/health"
    echo "   curl http://${SERVER_IP}:3002/health"
else
    echo ""
    echo "❌ Deployment failed"
    exit 1
fi
