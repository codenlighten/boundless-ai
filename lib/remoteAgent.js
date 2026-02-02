/**
 * RemoteAgent - AI agent that communicates with remote TerminalChatbot server
 * Enables orchestration of terminal operations across distributed systems
 */

export class RemoteAgent {
  constructor(serverUrl, apiKey) {
    this.serverUrl = serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.sessionId = `agent-${Date.now()}`;
    this.commandQueue = [];
    this.executionLog = [];
  }

  /**
   * Execute a terminal command on remote server
   * @param {string} command - Terminal command to execute
   * @returns {Promise<object>} Execution result
   */
  async executeCommand(command) {
    try {
      const response = await fetch(`${this.serverUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          command
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      this.executionLog.push({
        command,
        timestamp: new Date().toISOString(),
        result: data
      });

      return data;
    } catch (error) {
      console.error(`[RemoteAgent] Command failed: ${command}`, error);
      throw error;
    }
  }

  /**
   * Send a chat message with terminal context
   * @param {string} message - Chat message
   * @returns {Promise<object>} Agent response
   */
  async chat(message) {
    try {
      const response = await fetch(`${this.serverUrl}/chat/${this.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('[RemoteAgent] Chat failed:', error);
      throw error;
    }
  }

  /**
   * Get command execution history
   */
  async getHistory(limit = 50) {
    try {
      const response = await fetch(
        `${this.serverUrl}/history/${this.sessionId}?limit=${limit}`,
        {
          headers: { 'x-api-key': this.apiKey }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('[RemoteAgent] History fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get execution statistics
   */
  async getStats() {
    try {
      const response = await fetch(
        `${this.serverUrl}/stats/${this.sessionId}`,
        {
          headers: { 'x-api-key': this.apiKey }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error('[RemoteAgent] Stats fetch failed:', error);
      throw error;
    }
  }

  /**
   * Check server health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[RemoteAgent] Health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Queue commands for batch execution
   */
  queueCommand(command) {
    this.commandQueue.push(command);
    return this;
  }

  /**
   * Execute all queued commands in sequence
   */
  async executeBatch() {
    const results = [];

    for (const command of this.commandQueue) {
      try {
        const result = await this.executeCommand(command);
        results.push({
          command,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          command,
          success: false,
          error: error.message
        });
      }
    }

    this.commandQueue = []; // Clear queue
    return results;
  }

  /**
   * Execute sequence of dependent commands
   * Each command can depend on output from previous command
   */
  async executeSequence(commands) {
    const results = [];
    let context = {};

    for (const commandDef of commands) {
      const { name, command, dependsOn } = commandDef;

      try {
        // Replace variables with previous outputs
        let resolvedCommand = command;
        if (dependsOn && context[dependsOn]) {
          resolvedCommand = resolvedCommand.replace(
            `$${dependsOn}`,
            context[dependsOn].stdout.trim()
          );
        }

        const result = await this.executeCommand(resolvedCommand);

        context[name] = result;
        results.push({
          name,
          command: resolvedCommand,
          success: result.success,
          output: result.stdout
        });
      } catch (error) {
        results.push({
          name,
          command,
          success: false,
          error: error.message
        });

        // Stop on error
        break;
      }
    }

    return results;
  }

  /**
   * Get agent's local execution log
   */
  getExecutionLog() {
    return this.executionLog;
  }

  /**
   * Clear local execution log
   */
  clearExecutionLog() {
    this.executionLog = [];
  }
}

export default { RemoteAgent };
