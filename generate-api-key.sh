#!/bin/bash

echo "🔐 Generating Secure API Key"
echo ""

# Generate a 64-character random API key
API_KEY=$(openssl rand -base64 48 | tr -d '\n')

if [ $? -ne 0 ]; then
    # Fallback if openssl not available
    API_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
fi

echo "Generated API Key:"
echo ""
echo "$API_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add to .env file:"
echo "TERMINAL_API_KEY=$API_KEY"
echo ""
echo "⚠️  Save this key securely - it cannot be recovered!"
