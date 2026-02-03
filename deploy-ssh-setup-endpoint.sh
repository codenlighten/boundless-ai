#!/bin/bash

# Deploy SSH setup endpoint

echo "🚀 Deploying SSH setup endpoint..."
echo ""

# Commit and push
git add terminal-server.js test-ssh-setup.sh
git commit -m "feat: Add /setup-ssh endpoint for automated SSH key configuration" || true
git push origin main

# Deploy
bash deploy-https.sh

echo ""
echo "✅ Deployed!"
echo ""
echo "📋 New endpoint: POST /setup-ssh"
echo ""
echo "Nix can now setup SSH with:"
echo ""
echo 'curl -X POST http://143.110.129.9:3002/setup-ssh \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "x-api-key: YOUR_API_KEY" \'
echo '  -d '"'"'{'
echo '    "targetHost": "104.248.166.157",'
echo '    "targetUser": "root",'
echo '    "targetPassword": "PASSWORD_HERE"'
echo '  }'"'"''
echo ""
echo "Or test locally first:"
echo "  bash test-ssh-setup.sh"
echo ""
