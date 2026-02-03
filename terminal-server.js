import express from 'express';
import cors from 'cors';
import { TerminalChatbot } from './lib/terminalChatbot.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.TERMINAL_PORT || 3002;
const API_KEY = process.env.TERMINAL_API_KEY || 'change-me-in-production';
const DISABLE_WHITELIST = process.env.DISABLE_COMMAND_WHITELIST === 'true';

// Middleware
app.use(cors());
app.use(express.json());

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Session management
const sessions = new Map();

/**
 * Get or create a terminal chatbot session
 */
async function getOrCreateTerminalSession(sessionId) {
  try {
    if (!sessions.has(sessionId)) {
      const sessionPath = `./sessions/${sessionId}-terminal.json`;
      const chatbot = new TerminalChatbot(sessionPath, {
        disableWhitelist: DISABLE_WHITELIST
      });
      await chatbot.initialize();
      sessions.set(sessionId, chatbot);
      console.log(`[Terminal Session] Created: ${sessionId}`);
    }
    return sessions.get(sessionId);
  } catch (error) {
    console.error(`[Terminal Session] Error creating session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TerminalChatbot Server',
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
    apiKeyConfigured: API_KEY !== 'change-me-in-production'
  });
});

/**
 * POST /execute
 * Execute a terminal command
 * Headers: x-api-key
 * Body: { 
 *   sessionId: string, 
 *   command: string,
 *   context?: object (optional execution context)
 * }
 */
app.post('/execute', authenticateApiKey, async (req, res) => {
  try {
    const { sessionId, command, context } = req.body;

    if (!sessionId || !command) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['sessionId', 'command'],
        timestamp: new Date().toISOString()
      });
    }

    const chatbot = await getOrCreateTerminalSession(sessionId);
    
    // Add context to command execution if provided
    const executionContext = context ? { additionalContext: context } : {};
    const result = await chatbot.executeCommand(command, sessionId);

    res.json({
      success: result.success,
      ...result,
      context: context || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/execute] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /history/:sessionId
 * Get command execution history for a session
 */
app.get('/history/:sessionId', authenticateApiKey, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const chatbot = await getOrCreateTerminalSession(sessionId);
    const history = chatbot.getCommandHistory(limit);

    res.json({
      success: true,
      sessionId,
      history,
      totalRecords: chatbot.commandHistory.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/history/:sessionId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /stats/:sessionId
 * Get execution statistics for a session
 */
app.get('/stats/:sessionId', authenticateApiKey, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatbot = await getOrCreateTerminalSession(sessionId);
    const stats = chatbot.getExecutionStats();

    res.json({
      success: true,
      sessionId,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/stats/:sessionId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /chat/:sessionId
 * Send a chat message (extends to terminal context)
 * Body: { 
 *   message: string (or query: string),
 *   context?: object (optional context)
 * }
 */
app.post('/chat/:sessionId', authenticateApiKey, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, query, context } = req.body;
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

    res.json({
      success: true,
      sessionId,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/chat/:sessionId] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /chat/:sessionId/execute
 * Get LLM terminal command decision and auto-execute if approved
 * If command requires sudo/approval, returns pendingApproval flag requiring second call with approval=true
 * Headers: x-api-key
 * Body: {
 *   message: string (or query),
 *   context?: object,
 *   approval?: boolean (required if command needs approval)
 * }
 * Returns:
 * - If no command needed: { response, executionResult: null }
 * - If command needed & no approval required: { response, executionResult: {...} }
 * - If command needs approval: { response, pendingApproval: true, requiresApprovalReason: "..." }
 */
app.post('/chat/:sessionId/execute', authenticateApiKey, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, query, context, approval } = req.body;
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

    // If LLM didn't choose terminal command, just return response
    if (response.choice !== 'terminalCommand' || !response.terminalCommand) {
      return res.json({
        success: true,
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
      // Return pending approval state
      return res.json({
        success: true,
        sessionId,
        response,
        pendingApproval: true,
        requiresApprovalReason: `This command requires approval: "${response.terminalCommand}"`,
        approvalInstructions: 'Please review the command and send this request again with approval: true',
        timestamp: new Date().toISOString()
      });
    }

    // Execute the approved command
    const executionResult = await chatbot.executeCommand(response.terminalCommand, sessionId);

    res.json({
      success: true,
      sessionId,
      response,
      executionResult,
      approved: isDangerous ? true : undefined,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[/chat/:sessionId/execute] Error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /setup-ssh
 * Setup SSH access to a remote server
 * Body: {
 *   targetHost: string,
 *   targetUser: string,
 *   targetPassword: string
 * }
 */
app.post('/setup-ssh', authenticateApiKey, async (req, res) => {
  try {
    const { targetHost, targetUser, targetPassword } = req.body;

    if (!targetHost || !targetUser || !targetPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['targetHost', 'targetUser', 'targetPassword'],
        timestamp: new Date().toISOString()
      });
    }

    console.log(`[/setup-ssh] Setting up SSH access to ${targetUser}@${targetHost}`);

    // Check if SSH key exists
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    let keyExists = false;
    try {
      await execAsync('test -f ~/.ssh/id_rsa');
      keyExists = true;
    } catch (e) {
      // Key doesn't exist
    }

    // Generate key if needed
    if (!keyExists) {
      console.log('[/setup-ssh] Generating SSH key...');
      await execAsync('ssh-keygen -t rsa -b 4096 -C "boundless-ai" -f ~/.ssh/id_rsa -N ""');
    }

    // Get public key
    const { stdout: pubKey } = await execAsync('cat ~/.ssh/id_rsa.pub');

    // Install sshpass if not available
    try {
      await execAsync('which sshpass');
    } catch (e) {
      console.log('[/setup-ssh] Installing sshpass...');
      try {
        await execAsync('apt-get update && apt-get install -y sshpass', { timeout: 60000 });
      } catch (installError) {
        return res.status(500).json({
          error: 'Failed to install sshpass. Manual setup required.',
          details: installError.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Copy SSH key using sshpass
    const sshCopyCommand = `sshpass -p '${targetPassword}' ssh-copy-id -o StrictHostKeyChecking=no ${targetUser}@${targetHost}`;
    
    try {
      await execAsync(sshCopyCommand, { timeout: 30000 });
      console.log('[/setup-ssh] SSH key copied successfully');
    } catch (copyError) {
      return res.status(500).json({
        error: 'Failed to copy SSH key',
        details: copyError.message,
        timestamp: new Date().toISOString()
      });
    }

    // Test SSH connection
    const testCommand = `ssh -o BatchMode=yes -o ConnectTimeout=5 ${targetUser}@${targetHost} 'whoami'`;
    let testResult;
    try {
      const { stdout } = await execAsync(testCommand);
      testResult = stdout.trim();
      console.log('[/setup-ssh] SSH connection test successful:', testResult);
    } catch (testError) {
      return res.status(500).json({
        error: 'SSH key copied but connection test failed',
        details: testError.message,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'SSH access configured successfully',
      target: `${targetUser}@${targetHost}`,
      publicKey: pubKey.trim(),
      connectionTest: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[/setup-ssh] Error:', error);
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
    service: 'TerminalChatbot API',
    version: '1.0.0',
    description: 'Remote terminal execution with AI memory context',
    authentication: 'x-api-key header required',
    endpoints: {
      'POST /execute': {
        description: 'Execute a terminal command',
        headers: { 'x-api-key': 'your-api-key' },
        body: { sessionId: 'string', command: 'string' },
        example: { sessionId: 'user123', command: 'ls -la' }
      },
      'POST /setup-ssh': {
        description: 'Setup SSH access to a remote server',
        headers: { 'x-api-key': 'your-api-key' },
        body: { targetHost: 'string', targetUser: 'string', targetPassword: 'string' },
        example: { targetHost: '104.248.166.157', targetUser: 'root', targetPassword: 'your-password' }
      },
      'GET /history/:sessionId': {
        description: 'Get command execution history',
        query: { limit: 'number (default: 50)' }
      },
      'GET /stats/:sessionId': {
        description: 'Get execution statistics'
      },
      'POST /chat/:sessionId': {
        description: 'Send chat message with terminal context',
        body: { message: 'string' }
      },
      'GET /health': {
        description: 'Health check endpoint'
      }
    }
  });
});

/**
 * Error handling
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
  console.log(`\n🚀 TerminalChatbot Server started on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 API Key configured: ${API_KEY !== 'change-me-in-production' ? 'Yes' : 'No (Change in .env)'}\n`);
});

// Graceful shutdown
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
