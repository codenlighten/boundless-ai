#!/bin/bash

SERVER_IP="143.110.129.9"
API_KEY="9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx"

echo "🧪 Testing Boundless AI Deployment on ${SERVER_IP}"
echo ""

# Test Chat Server
echo "1️⃣ Testing Chat Server (port 3001)..."
CHAT_HEALTH=$(curl -s http://${SERVER_IP}:3001/health)
if [ $? -eq 0 ]; then
    echo "✅ Chat Server is responding"
    echo "$CHAT_HEALTH" | head -3
else
    echo "❌ Chat Server not responding"
fi
echo ""

# Test Terminal Server
echo "2️⃣ Testing Terminal Server (port 3002)..."
TERM_HEALTH=$(curl -s http://${SERVER_IP}:3002/health)
if [ $? -eq 0 ]; then
    echo "✅ Terminal Server is responding"
    echo "$TERM_HEALTH" | head -3
else
    echo "❌ Terminal Server not responding"
fi
echo ""

# Test Chat API
echo "3️⃣ Testing Chat API..."
CHAT_RESPONSE=$(curl -s -X POST http://${SERVER_IP}:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-user","message":"Hello! Just testing the deployment."}')

if echo "$CHAT_RESPONSE" | grep -q "success"; then
    echo "✅ Chat API working"
    echo "$CHAT_RESPONSE" | head -5
else
    echo "❌ Chat API issue"
fi
echo ""

# Test Terminal API
echo "4️⃣ Testing Terminal API..."
TERM_RESPONSE=$(curl -s -X POST http://${SERVER_IP}:3002/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"sessionId":"test-user","command":"pwd"}')

if echo "$TERM_RESPONSE" | grep -q "success"; then
    echo "✅ Terminal API working"
    echo "$TERM_RESPONSE" | head -5
else
    echo "❌ Terminal API issue (check API key)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Server Status:"
ssh root@${SERVER_IP} 'pm2 status'
echo ""
echo "🌐 Your services are live at:"
echo "   Chat API: http://${SERVER_IP}:3001"
echo "   Terminal API: http://${SERVER_IP}:3002"
echo ""
echo "📜 View logs: ssh root@${SERVER_IP} 'pm2 logs'"
