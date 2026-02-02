#!/bin/bash

# Simple tarball creator - runs immediately
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="memorychatbot-${TIMESTAMP}.tar.gz"

echo "📦 Creating deployment package: ${ARCHIVE}"

tar -czf ${ARCHIVE} \
  --exclude='node_modules' \
  --exclude='sessions/*.json' \
  --exclude='*.log' \
  --exclude='.git*' \
  --exclude='.env' \
  --exclude='test-*.js' \
  --exclude='start-chatbot.js' \
  --exclude='session.json' \
  --exclude='test-session.json' \
  --exclude='*.sh' \
  --exclude='*.swp' \
  package.json \
  package-lock.json \
  server.js \
  lib/ \
  schemas/ \
  Dockerfile \
  captain-definition \
  docker-compose.yml \
  .dockerignore \
  *.md

echo "✅ Created: ${ARCHIVE}"
echo "📊 Size: $(du -h ${ARCHIVE} | cut -f1)"
ls -lh ${ARCHIVE}
