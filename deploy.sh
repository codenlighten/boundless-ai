#!/bin/bash

# Create deployment tarball
VERSION=${1:-"v1.0.0"}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="memorychatbot-${VERSION}-${TIMESTAMP}.tar.gz"

echo "📦 Creating deployment package"
echo "Version: ${VERSION}"
echo "Archive: ${ARCHIVE_NAME}"
echo ""

# Create temporary staging directory
STAGING="deploy-staging"
rm -rf ${STAGING}
mkdir -p ${STAGING}

echo "📋 Copying files..."

# Copy individual files
cp package.json ${STAGING}/ && echo "  ✓ package.json"
cp package-lock.json ${STAGING}/ && echo "  ✓ package-lock.json"
cp server.js ${STAGING}/ && echo "  ✓ server.js"
cp Dockerfile ${STAGING}/ && echo "  ✓ Dockerfile"
cp captain-definition ${STAGING}/ && echo "  ✓ captain-definition"
cp docker-compose.yml ${STAGING}/ && echo "  ✓ docker-compose.yml"
cp .dockerignore ${STAGING}/ && echo "  ✓ .dockerignore"

# Copy directories
cp -r lib ${STAGING}/ && echo "  ✓ lib/"
cp -r schemas ${STAGING}/ && echo "  ✓ schemas/"

# Copy documentation
[ -f SERVER.md ] && cp SERVER.md ${STAGING}/ && echo "  ✓ SERVER.md"
[ -f DEPLOYMENT.md ] && cp DEPLOYMENT.md ${STAGING}/ && echo "  ✓ DEPLOYMENT.md"
[ -f README.md ] && cp README.md ${STAGING}/ && echo "  ✓ README.md"

# Create sessions directory
mkdir -p ${STAGING}/sessions
echo "  ✓ sessions/ (empty)"

# Create .env.example
cat > ${STAGING}/.env.example << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_DEFAULT_TEMPERATURE=0.7

# Server Configuration
PORT=3000
NODE_ENV=production
EOF
echo "  ✓ .env.example"

echo ""
echo "📦 Creating tarball..."
tar -czf ${ARCHIVE_NAME} -C ${STAGING} .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Package created successfully!"
    echo ""
    echo "📦 File: ${ARCHIVE_NAME}"
    echo "📊 Size: $(du -h ${ARCHIVE_NAME} | cut -f1)"
    echo ""
    echo "📋 Contents:"
    tar -tzf ${ARCHIVE_NAME} | head -20
    TOTAL_FILES=$(tar -tzf ${ARCHIVE_NAME} | wc -l)
    echo "   ... (${TOTAL_FILES} files total)"
    echo ""
    echo "🚀 Deploy instructions:"
    echo "   1. Upload: scp ${ARCHIVE_NAME} user@server:/path/"
    echo "   2. Extract: tar -xzf ${ARCHIVE_NAME}"
    echo "   3. Install: npm install --production"
    echo "   4. Configure: cp .env.example .env && nano .env"
    echo "   5. Run: npm start"
    
    # Cleanup
    rm -rf ${STAGING}
    
    exit 0
else
    echo ""
    echo "❌ Failed to create package"
    rm -rf ${STAGING}
    exit 1
fi
