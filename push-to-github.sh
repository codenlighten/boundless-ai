#!/bin/bash

# GitHub-based deployment to Digital Ocean
# Use this when direct SSH is unavailable

SERVER_IP="143.110.129.9"
SERVER_USER="root"
REMOTE_DIR="/var/www/ai-verify"
REPO_URL="git@github.com:codenlighten/boundless-ai.git"

echo "🚀 GitHub-based Deployment"
echo "Repository: ${REPO_URL}"
echo "Server: ${SERVER_USER}@${SERVER_IP}"
echo ""

# Check if git repo is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not initialized"
    echo "Run these commands first:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    echo "  git branch -M main"
    echo "  git remote add origin ${REPO_URL}"
    echo "  git push -u origin main"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted changes detected"
    echo "Committing changes..."
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Failed to push to GitHub"
    exit 1
fi

echo "✅ Code pushed to GitHub"
echo ""
echo "🔧 Now deploy on server by running:"
echo ""
echo "ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'"
echo "set -e"
echo ""
echo "# Install dependencies if needed"
echo "which git >/dev/null || apt-get install -y git"
echo "which node >/dev/null || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)"
echo "which pm2 >/dev/null || npm install -g pm2"
echo ""
echo "# Clone or update repository"
echo "if [ -d ${REMOTE_DIR}/.git ]; then"
echo "  echo 'Updating existing repository...'"
echo "  cd ${REMOTE_DIR}"
echo "  git pull origin main"
echo "else"
echo "  echo 'Cloning repository...'"
echo "  mkdir -p $(dirname ${REMOTE_DIR})"
echo "  git clone ${REPO_URL} ${REMOTE_DIR}"
echo "  cd ${REMOTE_DIR}"
echo "fi"
echo ""
echo "# Setup environment"
echo "cat > .env << 'EOF'"
cat .env
echo "EOF"
echo "chmod 600 .env"
echo ""
echo "# Install and start"
echo "npm install --production"
echo "mkdir -p sessions"
echo ""
echo "# Restart services"
echo "pm2 delete ai-verify-chat 2>/dev/null || true"
echo "pm2 delete ai-verify-terminal 2>/dev/null || true"
echo "pm2 start server.js --name ai-verify-chat"
echo "pm2 start terminal-server.js --name ai-verify-terminal"
echo "pm2 save"
echo ""
echo "echo '✅ Deployment complete!'"
echo "pm2 status"
echo "ENDSSH"
echo ""
echo "Or use the helper script: bash deploy-via-github.sh"
