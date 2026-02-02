#!/bin/bash

# Quick deployment tarball creator
# Usage: ./package-deploy.sh [version]
# Example: ./package-deploy.sh v1.0.0

VERSION=${1:-$(git describe --tags --always 2>/dev/null || echo "latest")}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="memorychatbot-${VERSION}-${TIMESTAMP}.tar.gz"

echo "📦 Packaging MemoryChatbot for deployment"
echo "Version: ${VERSION}"
echo "Archive: ${ARCHIVE_NAME}"
echo ""

# Files to include
FILES=(
    "package.json"
    "package-lock.json"
    "server.js"
    "Dockerfile"
    "captain-definition"
    "docker-compose.yml"
    ".dockerignore"
    "lib/"
    "schemas/"
    "SERVER.md"
    "DEPLOYMENT.md"
)

# Optional files
OPTIONAL_FILES=(
    "README.md"
)

echo "📋 Including files in package..."
for file in "${FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (missing)"
    fi
done

# Create tarball with progress
tar -czf ${ARCHIVE_NAME} \
    --exclude='node_modules' \
    --exclude='sessions/*.json' \
    --exclude='*.log' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='test-*.js' \
    --exclude='start-*.js' \
    --exclude='session.json' \
    --exclude='test-session.json' \
    --exclude='*.sh' \
    "${FILES[@]}" 2>/dev/null

# Add optional files if they exist
for file in "${OPTIONAL_FILES[@]}"; do
    if [ -e "$file" ]; then
        tar -rzf ${ARCHIVE_NAME} "$file" 2>/dev/null
    fi
done

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Package created successfully!"
    echo ""
    echo "📦 File: ${ARCHIVE_NAME}"
    echo "📊 Size: $(du -h ${ARCHIVE_NAME} | cut -f1)"
    echo ""
    echo "📋 Contents:"
    tar -tzf ${ARCHIVE_NAME}
    echo ""
    echo "🚀 Deploy instructions:"
    echo "   1. Upload to server: scp ${ARCHIVE_NAME} user@server:/path/"
    echo "   2. Extract: tar -xzf ${ARCHIVE_NAME}"
    echo "   3. Install: npm install --production"
    echo "   4. Configure: Create .env file with OPENAI_API_KEY"
    echo "   5. Run: npm start"
else
    echo ""
    echo "❌ Failed to create package"
    exit 1
fi
