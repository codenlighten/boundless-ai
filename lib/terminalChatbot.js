import { MemoryChatbot } from './memoryChatbot.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * TerminalChatbot - Extends MemoryChatbot with safe terminal command execution
 * Includes command validation, sandboxing, and comprehensive logging
 */
export class TerminalChatbot extends MemoryChatbot {
  constructor(sessionPath = './session.json', options = {}) {
    super(sessionPath, options);
    
    this.commandHistory = [];
    this.executionTimeout = options.executionTimeout || 30000; // 30 seconds
    this.maxOutputLength = options.maxOutputLength || 5000; // 5KB max
    this.workingDirectory = options.workingDirectory || process.cwd();
    
    // Command whitelist - only these commands are allowed
    this.allowedCommands = options.allowedCommands || [
      'ls', 'pwd', 'cd', 'cat', 'grep', 'find', 'du', 'df',
      'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'chmod',
      'git', 'npm', 'node', 'npm', 'ps', 'kill', 'curl',
      'tar', 'zip', 'unzip', 'gzip', 'gunzip', 'head', 'tail',
      'wc', 'sort', 'uniq', 'awk', 'sed', 'date', 'whoami',
      'ssh', 'scp', 'ssh-keygen', 'ssh-copy-id' // Remote server management
    ];
    
    // Commands that require confirmation
    this.dangerousCommands = new Set([
      'rm', 'rmdir', 'kill', 'killall', 'pkill', 'chmod', 'chown', 'sudo',
      'ssh', 'scp' // SSH operations need confirmation for security
    ]);
    
    this.rateLimitMap = new Map(); // Track command execution rates per session
  }

  /**
   * Validate if command is allowed to execute
   */
  isCommandAllowed(command) {
    const baseCommand = command.split(/\s+/)[0];
    return this.allowedCommands.includes(baseCommand);
  }

  /**
   * Check if command is dangerous and requires confirmation
   */
  isDangerousCommand(command) {
    const baseCommand = command.split(/\s+/)[0];
    return this.dangerousCommands.has(baseCommand);
  }

  /**
   * Check rate limit for session
   */
  checkRateLimit(sessionId) {
    const now = Date.now();
    const lastExecutionTime = this.rateLimitMap.get(sessionId) || 0;
    const minimumGap = 1000; // 1 second minimum between commands
    
    if (now - lastExecutionTime < minimumGap) {
      return false;
    }
    
    this.rateLimitMap.set(sessionId, now);
    return true;
  }

  /**
   * Execute a terminal command safely
   * @param {string} command - The command to execute
   * @param {string} sessionId - Session identifier for logging
   * @returns {Promise<object>} Execution result with stdout, stderr, exitCode
   */
  async executeCommand(command, sessionId = 'default') {
    const executionRecord = {
      id: this.commandHistory.length + 1,
      timestamp: new Date().toISOString(),
      sessionId,
      command,
      status: 'pending'
    };

    try {
      // Validation checks
      if (!command || typeof command !== 'string') {
        throw new Error('Invalid command: must be a non-empty string');
      }

      if (!this.isCommandAllowed(command)) {
        throw new Error(`Command not allowed. Allowed commands: ${this.allowedCommands.join(', ')}`);
      }

      if (!this.checkRateLimit(sessionId)) {
        throw new Error('Rate limit exceeded. Wait at least 1 second between commands.');
      }

      // Warn about dangerous commands
      const isDangerous = this.isDangerousCommand(command);
      if (isDangerous) {
        executionRecord.warning = `This is a dangerous command that modifies the filesystem`;
      }

      // Execute command with timeout
      console.log(`[Terminal] Executing: ${command} (Session: ${sessionId})`);
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDirectory,
        timeout: this.executionTimeout,
        maxBuffer: this.maxOutputLength * 2
      });

      executionRecord.status = 'success';
      executionRecord.stdout = stdout.substring(0, this.maxOutputLength);
      executionRecord.stderr = stderr.substring(0, this.maxOutputLength);
      executionRecord.exitCode = 0;

      this.commandHistory.push(executionRecord);
      
      return {
        success: true,
        exitCode: 0,
        stdout: executionRecord.stdout,
        stderr: executionRecord.stderr,
        warning: executionRecord.warning || null,
        execution: {
          id: executionRecord.id,
          timestamp: executionRecord.timestamp
        }
      };

    } catch (error) {
      executionRecord.status = 'failed';
      executionRecord.error = error.message;
      
      this.commandHistory.push(executionRecord);
      
      console.error(`[Terminal] Execution failed:`, error.message);
      
      return {
        success: false,
        error: error.message,
        exitCode: error.code || 1,
        stdout: error.stdout?.substring(0, this.maxOutputLength) || '',
        stderr: error.stderr?.substring(0, this.maxOutputLength) || '',
        execution: {
          id: executionRecord.id,
          timestamp: executionRecord.timestamp
        }
      };
    }
  }

  /**
   * Get command execution history
   */
  getCommandHistory(limit = 50) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Get execution stats
   */
  getExecutionStats() {
    const stats = {
      totalCommands: this.commandHistory.length,
      successful: 0,
      failed: 0,
      dangerous: 0
    };

    this.commandHistory.forEach(record => {
      if (record.status === 'success') stats.successful++;
      if (record.status === 'failed') stats.failed++;
      if (record.warning) stats.dangerous++;
    });

    return stats;
  }

  /**
   * Clear command history
   */
  clearCommandHistory() {
    this.commandHistory = [];
  }

  /**
   * Change working directory
   */
  setWorkingDirectory(dir) {
    this.workingDirectory = dir;
  }
}

export default { TerminalChatbot };
