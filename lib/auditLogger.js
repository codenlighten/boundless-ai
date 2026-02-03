import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Audit logger for tracking user actions and terminal commands
 * Writes to auditlog.jsonl (one JSON object per line)
 */
export class AuditLogger {
  constructor(logDir = './auditlogs') {
    this.logDir = logDir;
    this.logFile = path.join(logDir, 'auditlog.jsonl');
    
    // Ensure directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Log a terminal command execution
   */
  logTerminalCommand({
    userId,
    sessionId,
    command,
    success,
    exitCode,
    stdout,
    stderr,
    requiresApproval,
    approved,
    warning,
    executionTime
  }) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'terminal_command',
      userId,
      sessionId,
      command: command.substring(0, 500), // Truncate very long commands
      success,
      exitCode,
      stdoutLength: stdout ? stdout.length : 0,
      stderrLength: stderr ? stderr.length : 0,
      requiresApproval: !!requiresApproval,
      approved: !!approved,
      hasWarning: !!warning,
      executionTime: executionTime || null
    };

    this.write(entry);
  }

  /**
   * Log a chat message
   */
  logChat({
    userId,
    sessionId,
    userMessage,
    responseType,
    hasCommand,
    tokens
  }) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'chat_message',
      userId,
      sessionId,
      userMessageLength: userMessage.length,
      responseType, // 'response', 'code', 'terminalCommand'
      hasCommand: !!hasCommand,
      tokens: tokens || null
    };

    this.write(entry);
  }

  /**
   * Log an authentication event
   */
  logAuth({
    userId,
    action,
    role,
    success,
    reason
  }) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'auth',
      userId,
      action, // 'token_issued', 'token_verified', 'access_denied'
      role,
      success,
      reason: reason || null
    };

    this.write(entry);
  }

  /**
   * Log approval event
   */
  logApproval({
    userId,
    sessionId,
    command,
    approved
  }) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'approval',
      userId,
      sessionId,
      command: command.substring(0, 500),
      approved
    };

    this.write(entry);
  }

  /**
   * Write entry to audit log
   */
  write(entry) {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, line, 'utf8');
    } catch (error) {
      console.error('[AuditLogger] Failed to write log:', error.message);
    }
  }

  /**
   * Read audit logs with optional filtering
   * @param {object} filter - { type, userId, startDate, endDate }
   * @param {number} limit - Max entries to return
   */
  read(filter = {}, limit = 100) {
    try {
      const content = fs.readFileSync(this.logFile, 'utf8');
      let entries = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .reverse(); // Most recent first

      // Apply filters
      if (filter.type) {
        entries = entries.filter(e => e.type === filter.type);
      }
      if (filter.userId) {
        entries = entries.filter(e => e.userId === filter.userId);
      }
      if (filter.sessionId) {
        entries = entries.filter(e => e.sessionId === filter.sessionId);
      }
      if (filter.startDate) {
        const start = new Date(filter.startDate);
        entries = entries.filter(e => new Date(e.timestamp) >= start);
      }
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        entries = entries.filter(e => new Date(e.timestamp) <= end);
      }

      return entries.slice(0, limit);
    } catch (error) {
      console.error('[AuditLogger] Failed to read logs:', error.message);
      return [];
    }
  }

  /**
   * Get stats for a user
   */
  getUserStats(userId) {
    const entries = this.read({ userId }, 1000);
    
    const stats = {
      userId,
      totalActions: entries.length,
      chatMessages: entries.filter(e => e.type === 'chat_message').length,
      terminalCommands: entries.filter(e => e.type === 'terminal_command').length,
      successfulCommands: entries.filter(e => e.type === 'terminal_command' && e.success).length,
      failedCommands: entries.filter(e => e.type === 'terminal_command' && !e.success).length,
      approvedCommands: entries.filter(e => e.type === 'terminal_command' && e.approved).length,
      lastAction: entries[0] ? entries[0].timestamp : null
    };

    return stats;
  }
}

export default AuditLogger;
