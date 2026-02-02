# TerminalChatbot - Remote Command Execution Server

## Overview

TerminalChatbot Server enables secure, AI-assisted terminal command execution on remote systems. It combines:
- **TerminalChatbot** - Safe terminal execution with command whitelisting
- **TerminalChatbot Server** - RESTful API for remote access
- **RemoteAgent** - Client library for orchestrating remote commands

Perfect for managing Digital Ocean droplets, cloud servers, or distributed systems remotely with AI assistance.

## Quick Start

### 1. Start Terminal Server

```bash
node terminal-server.js
```

Server runs on `http://localhost:3002`

### 2. Configure API Key

Edit `.env`:
```bash
TERMINAL_API_KEY=your-secure-key-here
```

### 3. Test with RemoteAgent

```bash
node test-remote-agent.js
```

## Architecture

```
RemoteAgent (Client)
    ↓
    ↓ HTTP/JSON
    ↓
Terminal Server (API)
    ↓
TerminalChatbot (Executor)
    ↓
System Shell
```

## Security Features

### Command Whitelisting
Only these commands are allowed by default:
- File ops: `ls, cat, grep, find, mkdir, touch, rm, cp, mv`
- Git: `git`
- Package management: `npm, node`
- Others: `curl, tar, zip, date, whoami, ps, kill`

### Rate Limiting
- 1 second minimum between commands per session
- Prevents command flooding

### API Key Authentication
All requests require `x-api-key` header

### Dangerous Command Warning
Commands like `rm`, `chmod`, `kill` are flagged with warnings

## API Endpoints

### POST /execute
Execute a terminal command

```bash
curl -X POST http://localhost:3002/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{
    "sessionId": "user123",
    "command": "ls -la"
  }'
```

Response:
```json
{
  "success": true,
  "exitCode": 0,
  "stdout": "file listing...",
  "stderr": "",
  "execution": {
    "id": 1,
    "timestamp": "2026-02-02T16:00:00Z"
  }
}
```

### GET /history/:sessionId
Get command execution history

```bash
curl http://localhost:3002/history/user123?limit=50 \
  -H "x-api-key: your-key"
```

### GET /stats/:sessionId
Get execution statistics

```bash
curl http://localhost:3002/stats/user123 \
  -H "x-api-key: your-key"
```

Response:
```json
{
  "success": true,
  "sessionId": "user123",
  "stats": {
    "totalCommands": 10,
    "successful": 9,
    "failed": 1,
    "dangerous": 2
  }
}
```

### POST /chat/:sessionId
Send a chat message with terminal context

```bash
curl -X POST http://localhost:3002/chat/user123 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{"message": "What files are in the current directory?"}'
```

## RemoteAgent Usage

### Basic Command Execution
```javascript
import { RemoteAgent } from './lib/remoteAgent.js';

const agent = new RemoteAgent('http://localhost:3002', 'api-key');

const result = await agent.executeCommand('ls -la');
console.log(result.stdout);
```

### Batch Execution
```javascript
const results = await agent
  .queueCommand('pwd')
  .queueCommand('date')
  .queueCommand('whoami')
  .executeBatch();
```

### Dependent Commands
```javascript
const sequence = [
  { name: 'findPython', command: 'which python3' },
  { name: 'getVersion', command: 'python3 --version' }
];

const results = await agent.executeSequence(sequence);
```

### Check Server Health
```javascript
const health = await agent.checkHealth();
console.log(health.status); // 'ok' or 'unhealthy'
```

## Use Cases

### 1. Digital Ocean Droplet Management
```javascript
const agent = new RemoteAgent('https://api.myserver.com', apiKey);

// Deploy application
await agent.queueCommand('cd /app && git pull origin main');
await agent.queueCommand('npm install --production');
await agent.queueCommand('pm2 restart app');
const results = await agent.executeBatch();
```

### 2. File Operations
```javascript
// Copy files, create directories, manage permissions
await agent.executeCommand('mkdir -p /var/app/data');
await agent.executeCommand('cp /source/* /var/app/data');
await agent.executeCommand('chmod 755 /var/app/data');
```

### 3. Server Monitoring
```javascript
// Check disk space, processes, etc
const du = await agent.executeCommand('du -sh *');
const ps = await agent.executeCommand('ps aux | grep node');
```

### 4. AI-Assisted Operations
Combine with universal agent for smart decision making:
```javascript
// Chat about filesystem
const response = await agent.chat('Show me large files in /var/log');
// Agent can analyze output and suggest actions
```

## Deployment to Digital Ocean

See [DIGITAL-OCEAN-DEPLOYMENT.md](./DIGITAL-OCEAN-DEPLOYMENT.md)

## Security Considerations

⚠️ **Important:** This is a powerful tool. Use with caution:

1. **Strong API Keys** - Use long, random keys in production
2. **Network Isolation** - Keep terminal server behind firewall
3. **HTTPS Only** - Use TLS/SSL for remote access
4. **Rate Limiting** - Consider rate limiting at reverse proxy level
5. **Audit Logging** - Monitor command execution history
6. **Whitelist Commands** - Restrict to needed commands only
7. **Avoid Root** - Run server with minimal privileges

## Configuration

### Environment Variables
```bash
TERMINAL_PORT=3002
TERMINAL_API_KEY=secure-key-here
NODE_ENV=production
```

### Custom Command Whitelist
Edit `lib/terminalChatbot.js` to customize allowed commands

## Troubleshooting

### "Invalid or missing API key"
- Check `x-api-key` header is included
- Verify key matches `TERMINAL_API_KEY` in `.env`

### Commands timing out
- Increase `executionTimeout` in TerminalChatbot constructor
- Check long-running commands don't exceed 30 second default

### Output truncated
- Output is limited to 5KB by default
- Modify `maxOutputLength` option if needed

## Monitoring

### Check Server Health
```bash
curl http://localhost:3002/health
```

### View Execution History
```bash
curl http://localhost:3002/history/sessionId -H "x-api-key: key"
```

### Get Statistics
```bash
curl http://localhost:3002/stats/sessionId -H "x-api-key: key"
```
