# Boundless AI - MemoryChatbot System

AI-powered chatbot system with persistent memory, remote terminal execution, and OpenAI integration.

## Features

- **MemoryChatbot** - Conversational AI with long-term memory and auto-summarization
- **TerminalChatbot** - Remote command execution with security controls
- **Universal Agent** - Flexible responses (conversation, code, terminal commands)
- **Session Management** - Persistent storage and personality evolution
- **RESTful APIs** - HTTP endpoints for chat and terminal operations
- **Remote Agent** - Client library for distributed system orchestration

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Start Servers

**Chat Server:**
```bash
npm start
# Runs on http://localhost:3001
```

**Terminal Server:**
```bash
node terminal-server.js
# Runs on http://localhost:3002
```

## API Endpoints

### Chat Server (Port 3001)
- `POST /chat` - Send message to chatbot
- `GET /session/:sessionId` - Get session info
- `GET /session/:sessionId/history` - Get conversation history
- `POST /session/:sessionId/clear` - Clear session

### Terminal Server (Port 3002)
- `POST /execute` - Execute terminal command (requires API key)
- `GET /history/:sessionId` - Get command history
- `GET /stats/:sessionId` - Get execution statistics
- `POST /chat/:sessionId` - Chat with terminal context

## Usage Examples

### Basic Chat
```javascript
import { MemoryChatbot } from './lib/memoryChatbot.js';

const chatbot = new MemoryChatbot('./session.json');
await chatbot.initialize();

const response = await chatbot.chat('Hello!');
console.log(response.response);
```

### Remote Terminal Execution
```javascript
import { RemoteAgent } from './lib/remoteAgent.js';

const agent = new RemoteAgent('http://localhost:3002', 'api-key');
const result = await agent.executeCommand('ls -la');
console.log(result.stdout);
```

### HTTP API
```bash
# Send chat message
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"user123","message":"Hello!"}'

# Execute command
curl -X POST http://localhost:3002/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{"sessionId":"user123","command":"ls -la"}'
```

## Deployment

### GitHub-based Deployment
```bash
# 1. Initialize and push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:codenlighten/boundless-ai.git
git push -u origin main

# 2. Deploy to server
bash deploy-via-github.sh
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or manual Docker
docker build -t boundless-ai .
docker run -d -p 3001:3001 -p 3002:3002 --env-file .env boundless-ai
```

### CapRover Deployment
```bash
caprover deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Documentation

- [SERVER.md](SERVER.md) - Chat server API documentation
- [TERMINAL-SERVER.md](TERMINAL-SERVER.md) - Terminal server documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide (Docker, CapRover)
- [DIGITAL-OCEAN-DEPLOYMENT.md](DIGITAL-OCEAN-DEPLOYMENT.md) - Digital Ocean specific guide

## Project Structure

```
ai-verify/
├── lib/
│   ├── chatbot.js              # Base chatbot (universal agent)
│   ├── memoryChatbot.js        # Chatbot with persistent memory
│   ├── terminalChatbot.js      # Chatbot with terminal execution
│   ├── remoteAgent.js          # Client for remote operations
│   ├── memoryStore.js          # Session/memory management
│   ├── openaiWrapper.js        # OpenAI API wrapper
│   └── memoryRecall.js         # Memory retrieval
├── schemas/
│   ├── universalAgent.js       # Universal agent response schema
│   ├── summarizeAgent.js       # Summary generation schema
│   └── ...                     # Other agent schemas
├── server.js                   # Chat server (port 3001)
├── terminal-server.js          # Terminal server (port 3002)
├── package.json
├── Dockerfile
├── docker-compose.yml
└── captain-definition
```

## Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-key
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_DEFAULT_TEMPERATURE=0.7

# Server Configuration
PORT=3001                        # Chat server port
TERMINAL_PORT=3002              # Terminal server port
TERMINAL_API_KEY=secure-key     # API key for terminal access
NODE_ENV=production
```

## Security

- ✅ API key authentication for terminal commands
- ✅ Command whitelisting (only safe commands allowed)
- ✅ Rate limiting (1 second between commands)
- ✅ Dangerous command warnings
- ✅ 30-second execution timeout
- ✅ Output size limiting
- ✅ Full audit trail

## Development

```bash
# Install dependencies
npm install

# Run tests
node test-server.js
node test-remote-agent.js

# Start in development
node server.js
node terminal-server.js
```

## License

ISC

## Author

Gregory Ward

## Repository

https://github.com/codenlighten/boundless-ai
