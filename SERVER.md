# MemoryChatbot Express Server

## Quick Start

1. **Start the server:**
   ```bash
   npm start
   # or
   node server.js
   ```
   Server runs on **http://localhost:3001**

2. **Test the API:**
   ```bash
   # In another terminal
   node test-server.js
   # or
   bash test-api.sh
   ```

## API Endpoints

### POST /chat
Send a message to the chatbot
```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"user123","message":"Hello!"}'
```

### GET /session/:sessionId
Get session statistics
```bash
curl http://localhost:3001/session/user123
```

### GET /session/:sessionId/history
Get full conversation history
```bash
curl http://localhost:3001/session/user123/history
```

### POST /session/:sessionId/clear
Clear session data
```bash
curl -X POST http://localhost:3001/session/user123/clear
```

### GET /health
Health check
```bash
curl http://localhost:3001/health
```

## Features

- ✅ RESTful API for chatbot interactions
- ✅ Session-based memory management
- ✅ Persistent conversation storage
- ✅ Universal agent responses (text, code, terminal commands)
- ✅ Personality evolution over time
- ✅ Auto-summarization of long conversations
- ✅ CORS enabled for web clients

## Session Storage

Each session is stored in `./sessions/{sessionId}.json` with:
- Conversation history
- AI-generated summaries
- Personality evolution data
- Interaction metadata
