#!/bin/bash

echo "🧪 Testing MemoryChatbot Server..."
echo ""
echo "Testing health endpoint..."
curl -s http://localhost:3001/health | jq '.'
echo ""

echo "Testing chat endpoint..."
curl -s -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-greg","message":"Hi, I am Gregory Ward"}' | jq '.'
echo ""

echo "Testing session info..."
curl -s http://localhost:3001/session/test-greg | jq '.stats'
echo ""

echo "✅ Manual tests complete!"
