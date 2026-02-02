import express from 'express';
import cors from 'cors';
import { MemoryChatbot } from './lib/memoryChatbot.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('[Startup] Initializing MemoryChatbot Server...');
console.log('[Startup] OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing');
console.log('[Startup] Port:', PORT);

// Middleware
app.use(cors());
app.use(express.json());

// Session management - one chatbot per client
const sessions = new Map();

/**
 * Get or create a chatbot session
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<MemoryChatbot>} Chatbot instance
 */
async function getOrCreateSession(sessionId) {
  try {
    if (!sessions.has(sessionId)) {
      const sessionPath = `./sessions/${sessionId}.json`;
      const chatbot = new MemoryChatbot(sessionPath);
      await chatbot.initialize();
      sessions.set(sessionId, chatbot);
      console.log(`[Session] Created new session: ${sessionId}`);
    }
    return sessions.get(sessionId);
  } catch (error) {
    console.error(`[Session] Error creating session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * POST /chat
 * Send a message to the chatbot
 * Body: { 
 *   sessionId: string, 
 *   message: string (or query: string),
 *   context?: object (optional additional context)
 * }
 */
app.post('/chat', async (req, res) => {
  try {
    const { sessionId, message, query, context } = req.body;
    const userMessage = message || query;

    if (!sessionId || !userMessage) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, message (or query)'
      });
    }

    // Format message with optional context
    let formattedMessage = userMessage;
    if (context && typeof context === 'object') {
      const contextStr = JSON.stringify(context, null, 2);
      formattedMessage = `${userMessage}\n\n[Additional Context]\n${contextStr}`;
    }

    const chatbot = await getOrCreateSession(sessionId);
    const response = await chatbot.chat(formattedMessage);

    res.json({
      success: true,
      sessionId,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/chat] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /session/:sessionId
 * Get session information and statistics
 */
app.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatbot = await getOrCreateSession(sessionId);
    const stats = chatbot.getSessionStats();
    const context = chatbot.getMemoryContext();

    res.json({
      success: true,
      sessionId,
      stats,
      interactionCount: context.interactions.length,
      summaryCount: context.summaries.length,
      recentInteractions: context.interactions.slice(-5).map(i => ({
        id: i.id,
        role: i.role,
        text: i.text.substring(0, 100),
        ts: i.ts
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/session/:sessionId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /session/:sessionId/clear
 * Clear all interactions for a session
 */
app.post('/session/:sessionId/clear', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatbot = await getOrCreateSession(sessionId);

    chatbot.session = {
      interactions: [],
      summaries: [],
      nextId: 1,
      personality: null,
      personalityEvolutionEnabled: true,
      personalityImmutable: false
    };

    const { saveSession } = await import('./lib/memoryStore.js');
    await saveSession(chatbot.sessionPath, chatbot.session);

    res.json({
      success: true,
      sessionId,
      message: 'Session cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/session/:sessionId/clear] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /session/:sessionId/history
 * Get conversation history
 */
app.get('/session/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatbot = await getOrCreateSession(sessionId);
    const context = chatbot.getMemoryContext();

    res.json({
      success: true,
      sessionId,
      interactions: context.interactions.map(i => ({
        id: i.id,
        role: i.role,
        text: i.text,
        ts: i.ts
      })),
      summaries: context.summaries.map(s => ({
        range: s.range,
        text: s.text,
        ts: s.ts
      })),
      totalInteractions: context.interactions.length,
      totalSummaries: context.summaries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/session/:sessionId/history] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MemoryChatbot Server',
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size
  });
});

/**
 * GET /
 * API documentation
 */
app.get('/', (req, res) => {
  res.json({
    service: 'MemoryChatbot API',
    version: '1.0.0',
    endpoints: {
      'POST /chat': {
        description: 'Send a message to chatbot',
        body: { sessionId: 'string', message: 'string' }
      },
      'GET /session/:sessionId': {
        description: 'Get session information'
      },
      'GET /session/:sessionId/history': {
        description: 'Get conversation history'
      },
      'POST /session/:sessionId/clear': {
        description: 'Clear session data'
      },
      'GET /health': {
        description: 'Health check'
      }
    }
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n🚀 MemoryChatbot Server started on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`\n[Server] Ready to accept connections\n`);
});

// Error handling for server startup
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use`);
    console.error('   Try: lsof -i :${PORT} and kill the process, or use a different port\n');
  } else {
    console.error('\n❌ Server error:', error.message);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, closing server...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, closing server...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

export default app;
