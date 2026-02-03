#!/bin/bash

# Deploy SSH and Remote Server Management Updates
# Run this locally to push changes to production

SERVER_IP="143.110.129.9"

echo "🚀 Deploying SSH capabilities to Boundless AI..."
echo ""

# Commit changes
echo "📝 Committing changes..."
git add lib/terminalChatbot.js setup-ssh-to-sntnl.sh
git commit -m "feat: Add SSH/SCP support for remote server management" || true
git push origin main

# Deploy to server
echo ""
echo "📦 Deploying to server..."
bash deploy-https.sh

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔐 Next: Setup SSH keys on the server"
echo ""
echo "Run on server (143.110.129.9):"
echo "  cd /var/www/ai-verify"
echo "  bash setup-ssh-to-sntnl.sh"
echo ""
echo "Or manually:"
echo "  ssh root@$SERVER_IP"
echo "  cd /var/www/ai-verify"
echo "  bash setup-ssh-to-sntnl.sh"
echo ""
echo "📋 New capabilities for Nix:"
echo "  • SSH remote command execution"
echo "  • SCP file transfers"
echo "  • ssh-keygen key management"
echo "  • All SSH ops require approval (security)"
echo ""
