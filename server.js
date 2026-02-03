import express from 'express';
import cors from 'cors';
import { MemoryChatbot } from './lib/memoryChatbot.js';
import { TerminalChatbot } from './lib/terminalChatbot.js';
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

// Session management - separate for chat and terminal
const chatSessions = new Map();
const terminalSessions = new Map();

/**
 * Get or create a chat session
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<MemoryChatbot>} Chatbot instance
 */
async function getOrCreateChatSession(sessionId) {
  try {
    if (!chatSessions.has(sessionId)) {
      const sessionPath = `./sessions/${sessionId}.json`;
      const chatbot = new MemoryChatbot(sessionPath);
      await chatbot.initialize();
      chatSessions.set(sessionId, chatbot);
      console.log(`[Chat Session] Created new session: ${sessionId}`);
    }
    return chatSessions.get(sessionId);
  } catch (error) {
    console.error(`[Chat Session] Error creating session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Get or create a terminal session
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<TerminalChatbot>} Terminal chatbot instance
 */
async function getOrCreateTerminalSession(sessionId) {
  try {
    if (!terminalSessions.has(sessionId)) {
      const sessionPath = `./sessions/${sessionId}-terminal.json`;
      const chatbot = new TerminalChatbot(sessionPath, {
        disableWhitelist: process.env.DISABLE_COMMAND_WHITELIST === 'true'
      });
      await chatbot.initialize();
      terminalSessions.set(sessionId, chatbot);
      console.log(`[Terminal Session] Created new session: ${sessionId}`);
    }
    return terminalSessions.get(sessionId);
  } catch (error) {
    console.error(`[Terminal Session] Error creating session ${sessionId}:`, error);
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

    const chatbot = await getOrCreateChatSession(sessionId);
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
    const chatbot = await getOrCreateChatSession(sessionId);
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
    const chatbot = await getOrCreateChatSession(sessionId);

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
    const chatbot = await getOrCreateChatSession(sessionId);
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

// ============================================================
// TERMINAL ENDPOINTS (requires JWT auth with 'team' role)
// ============================================================

/**
 * POST /terminal/execute
 * Direct terminal command execution (requires team role)
 * Headers: Authorization: Bearer <token>
 * Body: { sessionId: string, command: string, context?: object }
 */
app.post('/terminal/execute', authManager.middleware(), authManager.requireRole(['team', 'admin']), async (req, res) => {
  try {
    const { sessionId, command, context } = req.body;
    const userId = req.auth.userId;

    if (!sessionId || !command) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['sessionId', 'command'],
        timestamp: new Date().toISOString()
      });
    }

    const chatbot = await getOrCreateTerminalSession(sessionId);
    const result = await chatbot.executeCommand(command, sessionId);

    // Log terminal execution
    auditLogger.logTerminalCommand({
      userId,
      sessionId,
      command,
      success: result.success,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      warning: result.warning
    });

    res.json({
      success: result.success,
      user: userId,
      ...result,
      context: context || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/terminal/execute] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /terminal/history/:sessionId
 * Get command execution history (requires team role)
 */
app.get('/terminal/history/:sessionId', authManager.middleware(), authManager.requireRole(['team', 'admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth.userId;
    const limit = parseInt(req.query.limit) || 50;

    const chatbot = await getOrCreateTerminalSession(sessionId);
    const history = chatbot.getCommandHistory(limit);

    res.json({
      success: true,
      user: userId,
      sessionId,
      history,
      totalRecords: chatbot.commandHistory.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/terminal/history/:sessionId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /terminal/stats/:sessionId
 * Get execution statistics (requires team role)
 */
app.get('/terminal/stats/:sessionId', authManager.middleware(), authManager.requireRole(['team', 'admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.auth.userId;

    const chatbot = await getOrCreateTerminalSession(sessionId);
    const stats = chatbot.getExecutionStats();

    res.json({
      success: true,
      user: userId,
      sessionId,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/terminal/stats/:sessionId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /terminal/chat/:sessionId
 * Chat with terminal context (requires team role)
 * Body: { message: string (or query: string), context?: object }
 */
app.post('/terminal/chat/:sessionId', authManager.middleware(), authManager.requireRole(['team', 'admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, query, context } = req.body;
    const userId = req.auth.userId;
    const userMessage = message || query;

    if (!userMessage) {
      return res.status(400).json({
        error: 'Missing message (or query) field',
        timestamp: new Date().toISOString()
      });
    }

    // Format message with optional context
    let formattedMessage = userMessage;
    if (context && typeof context === 'object') {
      const contextStr = JSON.stringify(context, null, 2);
      formattedMessage = `${userMessage}\n\n[Additional Context]\n${contextStr}`;
    }

    const chatbot = await getOrCreateTerminalSession(sessionId);
    const response = await chatbot.chat(formattedMessage);

    // Log chat interaction
    auditLogger.logChat({
      userId,
      sessionId,
      userMessage,
      responseType: response.choice,
      hasCommand: response.choice === 'terminalCommand'
    });

    res.json({
      success: true,
      user: userId,
      sessionId,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/terminal/chat/:sessionId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /terminal/chat/:sessionId/execute
 * LLM decides and executes terminal commands with approval workflow (requires team role)
 * Body: { message: string (or query), context?: object, approval?: boolean }
 * Returns:
 * - If no command needed: { response, executionResult: null }
 * - If command needs approval: { response, pendingApproval: true }
 * - If approved: { response, executionResult: {...} }
 */
app.post('/terminal/chat/:sessionId/execute', authManager.middleware(), authManager.requireRole(['team', 'admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, query, context, approval } = req.body;
    const userId = req.auth.userId;
    const userMessage = message || query;

    if (!userMessage) {
      return res.status(400).json({
        error: 'Missing message (or query) field',
        timestamp: new Date().toISOString()
      });
    }

    // Format message with optional context
    let formattedMessage = userMessage;
    if (context && typeof context === 'object') {
      const contextStr = JSON.stringify(context, null, 2);
      formattedMessage = `${userMessage}\n\n[Additional Context]\n${contextStr}`;
    }

    const chatbot = await getOrCreateTerminalSession(sessionId);
    const response = await chatbot.chat(formattedMessage);

    // Log chat interaction
    auditLogger.logChat({
      userId,
      sessionId,
      userMessage,
      responseType: response.choice,
      hasCommand: response.choice === 'terminalCommand'
    });

    // If LLM didn't choose terminal command, just return response
    if (response.choice !== 'terminalCommand' || !response.terminalCommand) {
      return res.json({
        success: true,
        user: userId,
        sessionId,
        response,
        executionResult: null,
        timestamp: new Date().toISOString()
      });
    }

    // Check if command requires approval (dangerous/sudo command)
    const isDangerous = response.requiresApproval || 
                       response.terminalCommand.includes('sudo') ||
                       response.terminalCommand.match(/^(rm|kill|apt|systemctl|ufw|passwd|reboot|shutdown)/);

    if (isDangerous && !approval) {
      // Log approval request
      auditLogger.logApproval({
        userId,
        sessionId,
        command: response.terminalCommand,
        approved: false
      });

      // Return pending approval state
      return res.json({
        success: true,
        user: userId,
        sessionId,
        response,
        pendingApproval: true,
        requiresApprovalReason: `This command requires approval: "${response.terminalCommand}"`,
        approvalInstructions: 'Please review the command and send this request again with approval: true',
        timestamp: new Date().toISOString()
      });
    }

    // Execute the approved command
    const startTime = Date.now();
    const executionResult = await chatbot.executeCommand(response.terminalCommand, sessionId);
    const executionTime = Date.now() - startTime;

    // Log terminal execution with approval
    auditLogger.logTerminalCommand({
      userId,
      sessionId,
      command: response.terminalCommand,
      success: executionResult.success,
      exitCode: executionResult.exitCode,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
      requiresApproval: isDangerous,
      approved: isDangerous ? true : undefined,
      warning: executionResult.warning,
      executionTime
    });

    res.json({
      success: true,
      user: userId,
      sessionId,
      response,
      executionResult,
      approved: isDangerous ? true : undefined,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/terminal/chat/:sessionId/execute] Error:', error);
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
