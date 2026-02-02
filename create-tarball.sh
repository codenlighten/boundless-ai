#!/bin/bash

# Build deployment tarball for MemoryChatbot
VERSION=${1:-$(date +%Y%m%d-%H%M%S)}
ARCHIVE_NAME="memorychatbot-${VERSION}.tar.gz"

echo "📦 Creating deployment tarball: ${ARCHIVE_NAME}"
echo ""

# Create temporary directory
TEMP_DIR="./build-temp"
rm -rf ${TEMP_DIR}
mkdir -p ${TEMP_DIR}/memorychatbot

echo "📋 Copying application files..."

# Copy essential files
cp package*.json ${TEMP_DIR}/memorychatbot/
cp server.js ${TEMP_DIR}/memorychatbot/
cp Dockerfile ${TEMP_DIR}/memorychatbot/
cp captain-definition ${TEMP_DIR}/memorychatbot/
cp docker-compose.yml ${TEMP_DIR}/memorychatbot/
cp .dockerignore ${TEMP_DIR}/memorychatbot/

# Copy directories
cp -r lib ${TEMP_DIR}/memorychatbot/
cp -r schemas ${TEMP_DIR}/memorychatbot/

# Copy documentation
cp *.md ${TEMP_DIR}/memorychatbot/ 2>/dev/null || true

# Create sessions directory
mkdir -p ${TEMP_DIR}/memorychatbot/sessions

# Create .env.example (without actual keys)
cat > ${TEMP_DIR}/memorychatbot/.env.example << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_DEFAULT_TEMPERATURE=0.7

# Server Configuration
PORT=3000
NODE_ENV=production

# Optional: Platform Keys (if using BSV features)
# SIMPLEBSV_API_KEY=your-simplebsv-key
# MEMORY_ENCRYPTION_KEY=your-encryption-key
# PLATFORM_PRIVATE_KEY=your-private-key
# PLATFORM_PUBLIC_KEY=your-public-key
# API_BASE_URL=your-api-base-url

# Optional: Telegram Bot
# TELEGRAM_BOT_TOKEN=your-telegram-bot-token
EOF

# Create README for deployment
cat > ${TEMP_DIR}/memorychatbot/DEPLOY-README.md << 'EOF'
# MemoryChatbot Deployment Package

## Quick Start

1. **Extract the archive:**
   ```bash
   tar -xzf memorychatbot-*.tar.gz
   cd memorychatbot
   ```

2. **Install dependencies:**
   ```bash
   npm install --production
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env  # Add your OpenAI API key
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## Deployment Options

### Option 1: Direct Node.js
```bash
npm install --production
node server.js
```

### Option 2: Docker
```bash
docker build -t memorychatbot .
docker run -d -p 3000:3000 --env-file .env memorychatbot
```

### Option 3: Docker Compose
```bash
docker-compose up -d
```

### Option 4: CapRover
```bash
# Install CapRover CLI
npm install -g caprover

# Deploy
caprover deploy
```

## Required Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `PORT` - Server port (default: 3000)

See `.env.example` for all available options.

## Documentation

- `SERVER.md` - API documentation and usage
- `DEPLOYMENT.md` - Detailed deployment guide
- `README.md` - Project overview

## Support

For issues or questions, check the documentation files included in this package.
EOF

echo "🗜️  Creating tarball..."
cd ${TEMP_DIR}
tar -czf ../${ARCHIVE_NAME} memorychatbot/
cd ..

echo "🧹 Cleaning up..."
rm -rf ${TEMP_DIR}

echo ""
echo "✅ Deployment package created: ${ARCHIVE_NAME}"
echo ""
echo "📊 Package contents:"
tar -tzf ${ARCHIVE_NAME} | head -20
echo "   ... (and more)"
echo ""
echo "📦 Package size: $(du -h ${ARCHIVE_NAME} | cut -f1)"
echo ""
echo "🚀 To deploy:"
echo "   1. Upload ${ARCHIVE_NAME} to your server"
echo "   2. Extract: tar -xzf ${ARCHIVE_NAME}"
echo "   3. Follow instructions in DEPLOY-README.md"
echo ""
