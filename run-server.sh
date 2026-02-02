#!/bin/bash

# Check if server is running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use. Stopping existing server..."
    pkill -f "node server.js"
    sleep 2
fi

echo "🚀 Starting MemoryChatbot Server..."
node server.js 2>&1 | tee server.log
