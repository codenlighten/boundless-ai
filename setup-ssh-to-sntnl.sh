#!/bin/bash

# Setup SSH access from Boundless AI server to SNTNL node
# Run this on the Boundless AI server (143.110.129.9)

SNTNL_IP="104.248.166.157"
SNTNL_USER="root"  # Change if needed

echo "🔐 Setting up SSH access to SNTNL node..."
echo ""
echo "Target: $SNTNL_USER@$SNTNL_IP"
echo ""

# Check if SSH key already exists
if [ ! -f ~/.ssh/id_rsa ]; then
  echo "📝 Generating SSH key..."
  ssh-keygen -t rsa -b 4096 -C "boundless-ai@143.110.129.9" -f ~/.ssh/id_rsa -N ""
  echo "✅ SSH key generated"
else
  echo "✅ SSH key already exists"
fi

echo ""
echo "📋 Your public key:"
cat ~/.ssh/id_rsa.pub
echo ""

echo "🔧 Next steps:"
echo ""
echo "Option 1 - Manual (most secure):"
echo "  1. Copy the public key above"
echo "  2. SSH to SNTNL: ssh $SNTNL_USER@$SNTNL_IP"
echo "  3. Run: echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo "  4. Run: chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "Option 2 - Automatic (requires password once):"
echo "  Run: ssh-copy-id $SNTNL_USER@$SNTNL_IP"
echo ""
echo "After setup, test with:"
echo "  ssh $SNTNL_USER@$SNTNL_IP 'whoami'"
echo ""

read -p "Would you like to try automatic setup now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "🚀 Attempting ssh-copy-id..."
  ssh-copy-id "$SNTNL_USER@$SNTNL_IP"
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSH key copied successfully!"
    echo ""
    echo "Testing connection..."
    ssh "$SNTNL_USER@$SNTNL_IP" 'whoami && echo "SSH access confirmed!"'
  else
    echo ""
    echo "❌ Automatic setup failed. Use manual method above."
  fi
else
  echo ""
  echo "👍 Use manual method when ready."
fi

echo ""
echo "🎯 Once SSH is working, redeploy the updated code:"
echo "   cd /var/www/ai-verify"
echo "   git pull origin main"
echo "   pm2 restart terminal-server"
echo ""
