#!/bin/bash

echo "🐳 Building Docker image..."
docker build -t memorychatbot .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Run with:"
    echo "  docker run -d -p 3000:3000 --env-file .env memorychatbot"
    echo ""
    echo "Or use docker-compose:"
    echo "  docker-compose up -d"
else
    echo "❌ Build failed!"
    exit 1
fi
