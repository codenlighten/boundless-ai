#!/bin/bash

# Quick update - redeploy with new API key

SERVER_IP="143.110.129.9"

echo "🔐 Updating API key on server..."
echo ""

# Commit and push changes
git add .env
git commit -m "Update: Secure API key" || true
git push origin main

# Redeploy
bash deploy-https.sh

echo ""
echo "✅ API key updated and deployed!"
echo ""
echo "🔑 New API Key: 9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx"
echo ""
echo "Test with:"
echo "  bash test-deployment.sh"
