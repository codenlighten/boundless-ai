import express from 'express';
import cors from 'cors';
import { MemoryChatbot } from './lib/memoryChatbot.js';
import { AuthManager } from './lib/auth.js';
import { AuditLogger } from './lib/auditLogger.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.CHAT_PORT || process.env.PORT || 3001;
const authManager = new AuthManager();
const auditLogger = new AuditLogger();

console.log('[Startup] Initializing MemoryChatbot Server with JWT Auth...');
console.log('[Startup] OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing');
console.log('[Startup] Port:', PORT);
console.log('[Startup] JWT Secret:', process.env.JWT_SECRET ? 'Using env var' : 'Using generated secret');

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
 * GET /health
 * Health check endpoint (no auth required)
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MemoryChatbot Server',
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
    features: {
      auth: 'jwt',
      chat: true,
      terminal: false
    }
  });
});

/**
 * POST /auth/token
 * Issue a JWT token for API access (no auth required for initial token)
 * Body: { userId: string, role?: 'public'|'team'|'admin', expiresIn?: '24h' }
 * Returns: { token, expiresAt, userId, role }
 */
app.post('/auth/token', (req, res) => {
  try {
    const { userId, role = 'team', expiresIn } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid userId',
        timestamp: new Date().toISOString()
      });
    }

    const result = authManager.issueToken(userId, role, expiresIn);
    
    auditLogger.logAuth({
      userId,
      action: 'token_issued',
      role,
      success: true
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/auth/token] Error:', error);
    res.status(400).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /chat
 * Send a message to the chatbot (requires jwt token)
 * Headers: Authorization: Bearer <token>
 * Body: { 
 *   sessionId: string, 
 *   message: string (or query: string),
 *   context?: object (optional additional context)
 * }
 */
app.post('/chat', authManager.middleware(), async (req, res) => {
  try {
    const { sessionId, message, query, context } = req.body;
    const userMessage = message || query;
    const userId = req.auth.userId; // From JWT token

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

    // Log the chat interaction
    auditLogger.logChat({
      userId,
      sessionId,
      userMessage,
      responseType: response.choice,
      hasCommand: response.choice === 'terminalCommand'
    });

    res.json({
      success: true,
      sessionId,
      response,
      user: userId,
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
 * Get session information and statistics (requires jwt token)
 */
app.get('/session/:sessionId', authManager.middleware(), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth.userId;
    const chatbot = await getOrCreateSession(sessionId);
    const stats = chatbot.getSessionStats();
    const context = chatbot.getMemoryContext();

    res.json({
      success: true,
      sessionId,
      user: userId,
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
 * Clear all interactions for a session (requires jwt token)
 */
app.post('/session/:sessionId/clear', authManager.middleware(), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth.userId;
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

    auditLogger.logChat({
      userId,
      sessionId,
      userMessage: '[session cleared]',
      responseType: 'system'
    });

    res.json({
      success: true,
      sessionId,
      user: userId,
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
 * GET /audit/logs
 * Get audit logs (requires team or admin role)
 * Query params: type, userId, sessionId, limit
 */
app.get('/audit/logs', authManager.middleware(), authManager.requireRole(['team', 'admin']), (req, res) => {
  try {
    const { type, userId, sessionId, limit = 100 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.userId = userId;
    if (sessionId) filter.sessionId = sessionId;

    const logs = auditLogger.read(filter, parseInt(limit));

    res.json({
      success: true,
      count: logs.length,
      logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/audit/logs] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /audit/stats/:userId
 * Get user statistics from audit logs (requires team or admin role)
 */
app.get('/audit/stats/:userId', authManager.middleware(), authManager.requireRole(['team', 'admin']), (req, res) => {
  try {
    const { userId } = req.params;
    const stats = auditLogger.getUserStats(userId);

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/audit/stats/:userId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
