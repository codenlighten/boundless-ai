#!/bin/bash

# Test the SSH setup endpoint

API_KEY="9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx"
SERVER="http://143.110.129.9:3002"

# SNTNL node details
TARGET_HOST="104.248.166.157"
TARGET_USER="root"

echo "🔐 SSH Setup Endpoint Test"
echo ""
echo "This will configure SSH access from Boundless AI to SNTNL node"
echo ""
read -sp "Enter SNTNL root password: " TARGET_PASSWORD
echo ""
echo ""

echo "📡 Sending setup request..."

curl -X POST "$SERVER/setup-ssh" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"targetHost\": \"$TARGET_HOST\",
    \"targetUser\": \"$TARGET_USER\",
    \"targetPassword\": \"$TARGET_PASSWORD\"
  }" | jq .

echo ""
echo "✅ If successful, test SSH access:"
echo ""
echo "curl -X POST $SERVER/execute \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"x-api-key: $API_KEY\" \\"
echo "  -d '{\"sessionId\":\"test\",\"command\":\"ssh root@$TARGET_HOST whoami\"}'"
echo ""
