# Boundless AI - API Instructions

## Base URLs

- **Chat Server:** `http://143.110.129.9:3001`
- **Terminal Server:** `http://143.110.129.9:3002`

## Authentication

- **Chat API:** No authentication required
- **Terminal API:** Requires `x-api-key` header

**API Key:** `9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx`

---

## Chat API Endpoints

### 1. Health Check

```bash
GET /health
```

**Example:**
```bash
curl http://143.110.129.9:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "MemoryChatbot Server",
  "timestamp": "2026-02-02T22:09:05.600Z",
  "activeSessions": 0
}
```

---

### 2. Send Chat Message

```bash
POST /chat
Content-Type: application/json
```

**Body:**
```json
{
  "sessionId": "string (required)",
  "message": "string (required)"
}
```

**Example:**
```bash
curl -X POST http://143.110.129.9:3001/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "greg",
    "message": "Hello! Can you help me with Node.js?"
  }'
```

**Response:**
```json
{
  "success": true,
  "sessionId": "greg",
  "response": {
    "choice": "response",
    "response": "Hello! I'd be happy to help you with Node.js...",
    "questionsForUser": false,
    "questions": [],
    "missingContext": [],
    "code": "",
    "language": "",
    "codeExplanation": "",
    "terminalCommand": "",
    "commandReasoning": "",
    "requiresApproval": false,
    "continue": false
  },
  "timestamp": "2026-02-02T22:09:08.225Z"
}
```

**Response Types:**

The `choice` field determines the response type:

1. **"response"** - Conversational response
   - `response`: Text message
   - `questionsForUser`: Has follow-up questions
   - `questions`: Array of follow-up questions

2. **"code"** - Code generation
   - `code`: Generated code
   - `language`: Programming language
   - `codeExplanation`: What the code does

3. **"terminalCommand"** - Terminal command suggestion
   - `terminalCommand`: The command
   - `commandReasoning`: Why this command
   - `requiresApproval`: Needs user confirmation

---

### 3. Get Session Info

```bash
GET /session/:sessionId
```

**Example:**
```bash
curl http://143.110.129.9:3001/session/greg
```

**Response:**
```json
{
  "success": true,
  "sessionId": "greg",
  "stats": {
    "interactions": 4,
    "summaries": 0,
    "nextInteractionId": 5,
    "personality": "not yet evolved",
    "personalityEvolutionEnabled": true
  },
  "interactionCount": 4,
  "summaryCount": 0,
  "recentInteractions": [...]
}
```

---

### 4. Get Conversation History

```bash
GET /session/:sessionId/history
```

**Example:**
```bash
curl http://143.110.129.9:3001/session/greg/history
```

**Response:**
```json
{
  "success": true,
  "sessionId": "greg",
  "interactions": [
    {
      "id": 1,
      "role": "user",
      "text": "Hello!",
      "ts": "2026-02-02T22:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "text": "{...response...}",
      "ts": "2026-02-02T22:00:01Z"
    }
  ],
  "summaries": [],
  "totalInteractions": 4,
  "totalSummaries": 0
}
```

---

### 5. Clear Session

```bash
POST /session/:sessionId/clear
```

**Example:**
```bash
curl -X POST http://143.110.129.9:3001/session/greg/clear
```

**Response:**
```json
{
  "success": true,
  "sessionId": "greg",
  "message": "Session cleared"
}
```

---

## Terminal API Endpoints

### 1. Health Check

```bash
GET /health
```

**Example:**
```bash
curl http://143.110.129.9:3002/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "TerminalChatbot Server",
  "timestamp": "2026-02-02T22:09:05.764Z",
  "activeSessions": 0,
  "apiKeyConfigured": true
}
```

---

### 2. Execute Command

```bash
POST /execute
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

**Body:**
```json
{
  "sessionId": "string (required)",
  "command": "string (required)"
}
```

**Example:**
```bash
curl -X POST http://143.110.129.9:3002/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: 9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx" \
  -d '{
    "sessionId": "greg",
    "command": "ls -la"
  }'
```

**Response:**
```json
{
  "success": true,
  "exitCode": 0,
  "stdout": "total 64\ndrwxr-xr-x 4 root root 4096...",
  "stderr": "",
  "warning": null,
  "execution": {
    "id": 1,
    "timestamp": "2026-02-02T22:09:08.405Z"
  },
  "timestamp": "2026-02-02T22:09:08.413Z"
}
```

**Allowed Commands:**
- File operations: `ls`, `cat`, `grep`, `find`, `mkdir`, `touch`, `rm`, `cp`, `mv`
- Git: `git`
- Package management: `npm`, `node`
- System: `pwd`, `date`, `whoami`, `ps`, `df`, `du`
- Archive: `tar`, `zip`, `unzip`, `gzip`
- Network: `curl`
- Text processing: `head`, `tail`, `wc`, `sort`, `awk`, `sed`

**Rate Limiting:** 1 command per second per session

---

### 3. Get Command History

```bash
GET /history/:sessionId?limit=50
x-api-key: YOUR_API_KEY
```

**Example:**
```bash
curl "http://143.110.129.9:3002/history/greg?limit=10" \
  -H "x-api-key: 9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx"
```

**Response:**
```json
{
  "success": true,
  "sessionId": "greg",
  "history": [
    {
      "id": 1,
      "timestamp": "2026-02-02T22:09:08.405Z",
      "sessionId": "greg",
      "command": "ls -la",
      "status": "success",
      "exitCode": 0
    }
  ],
  "totalRecords": 1
}
```

---

### 4. Get Execution Statistics

```bash
GET /stats/:sessionId
x-api-key: YOUR_API_KEY
```

**Example:**
```bash
curl http://143.110.129.9:3002/stats/greg \
  -H "x-api-key: 9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx"
```

**Response:**
```json
{
  "success": true,
  "sessionId": "greg",
  "stats": {
    "totalCommands": 10,
    "successful": 9,
    "failed": 1,
    "dangerous": 2
  }
}
```

---

### 5. Chat with Terminal Context

```bash
POST /chat/:sessionId
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

**Body:**
```json
{
  "message": "string (required)"
}
```

**Example:**
```bash
curl -X POST http://143.110.129.9:3002/chat/greg \
  -H "Content-Type: application/json" \
  -H "x-api-key: 9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx" \
  -d '{
    "message": "What files are in the current directory?"
  }'
```

**Response:** Same format as Chat API `/chat` endpoint

---

## RemoteAgent (JavaScript Client)

For programmatic access, use the RemoteAgent class:

```javascript
import { RemoteAgent } from './lib/remoteAgent.js';

const agent = new RemoteAgent(
  'http://143.110.129.9:3002',
  '9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx'
);

// Execute single command
const result = await agent.executeCommand('ls -la');
console.log(result.stdout);

// Execute batch commands
const results = await agent
  .queueCommand('pwd')
  .queueCommand('date')
  .queueCommand('whoami')
  .executeBatch();

// Execute dependent sequence
const sequence = [
  { name: 'findFiles', command: 'find . -name "*.js"' },
  { name: 'countFiles', command: 'ls -1 | wc -l' }
];
const seqResults = await agent.executeSequence(sequence);

// Chat with context
const chatResponse = await agent.chat('Show me disk usage');
console.log(chatResponse.response.response);

// Get history
const history = await agent.getHistory();
console.log(history.totalRecords);

// Get stats
const stats = await agent.getStats();
console.log(stats.stats);
```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "error": "Error message",
  "timestamp": "2026-02-02T22:09:08.413Z"
}
```

**Common Error Codes:**

- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid/missing API key for Terminal API)
- `404` - Not Found (invalid endpoint)
- `500` - Internal Server Error

---

## Rate Limits

- **Chat API:** No rate limits
- **Terminal API:** 1 command per second per session

---

## Best Practices

1. **Use Unique Session IDs** - Each user/client should have their own sessionId
2. **Handle Errors** - Always check `success` field in responses
3. **Keep API Key Secret** - Never expose the Terminal API key in client-side code
4. **Command Validation** - Terminal API only allows whitelisted commands
5. **Memory Management** - Clear sessions when no longer needed
6. **Logging** - All terminal commands are logged with full audit trail

---

## Quick Test

```bash
# Test Chat API
curl -X POST http://143.110.129.9:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","message":"Hello!"}'

# Test Terminal API
curl -X POST http://143.110.129.9:3002/execute \
  -H "Content-Type: application/json" \
  -H "x-api-key: 9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx" \
  -d '{"sessionId":"test","command":"pwd"}'
```

---

## Support & Documentation

- Full Documentation: See `SERVER.md` and `TERMINAL-SERVER.md`
- GitHub: https://github.com/codenlighten/boundless-ai
- Issues: Report at repository Issues page

---

**Server Status:**
- Chat API: http://143.110.129.9:3001/health
- Terminal API: http://143.110.129.9:3002/health
