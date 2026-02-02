import { UniversalChatbot } from './chatbot.js';
import { loadSession, saveSession, addInteraction, buildContext } from './memoryStore.js';
import readline from 'readline';

/**
 * Memory-Aware Chatbot using Universal Agent + MemoryStore
 * Maintains conversation history with AI-powered summaries and personality evolution
 */
export class MemoryChatbot extends UniversalChatbot {
  constructor(sessionPath = './session.json', options = {}) {
    super(options);
    this.sessionPath = sessionPath;
    this.session = null;
    this.sessionLoaded = false;
  }

  /**
   * Initialize the chatbot by loading session from disk
   */
  async initialize() {
    this.session = await loadSession(this.sessionPath);
    this.sessionLoaded = true;
    console.log(`✓ Session loaded from ${this.sessionPath}`);
    console.log(`  • Interactions: ${this.session.interactions.length}`);
    console.log(`  • Summaries: ${this.session.summaries.length}`);
    if (this.session.personality) {
      console.log(`  • Personality: Evolved (${Object.keys(this.session.personality).length} traits)`);
    }
  }

  /**
   * Send a message with memory context
   * @param {string} userMessage - The user's input
   * @param {object} options - Optional configuration
   * @returns {Promise<object>} Structured response
   */
  async chat(userMessage, options = {}) {
    if (!this.sessionLoaded) {
      throw new Error('Chatbot not initialized. Call initialize() first.');
    }

    const {
      interactionsLimit = 21,
      summariesLimit = 3,
      sessionId = null
    } = options;

    // Build context from memory
    const memoryContext = buildContext(this.session);

    // Add user message to session
    await addInteraction(this.session, {
      role: 'user',
      text: userMessage
    }, {
      interactionsLimit,
      summariesLimit,
      sessionId
    });

    // Get response with memory context
    const chatOptions = {
      model: this.model,
      temperature: this.temperature,
      context: memoryContext
    };

    const response = await super.chat(userMessage, memoryContext);

    // Add assistant response to session
    await addInteraction(this.session, {
      role: 'assistant',
      text: JSON.stringify(response)
    }, {
      interactionsLimit,
      summariesLimit,
      sessionId
    });

    // Save session to disk
    await saveSession(this.sessionPath, this.session);

    return response;
  }

  /**
   * Get current session memory context
   */
  getMemoryContext() {
    if (!this.sessionLoaded) {
      throw new Error('Session not loaded');
    }
    return buildContext(this.session);
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    if (!this.sessionLoaded) {
      throw new Error('Session not loaded');
    }
    return {
      interactions: this.session.interactions.length,
      summaries: this.session.summaries.length,
      nextInteractionId: this.session.nextId,
      personality: this.session.personality ? 'evolved' : 'not yet evolved',
      personalityEvolutionEnabled: this.session.personalityEvolutionEnabled,
      personalityImmutable: this.session.personalityImmutable
    };
  }

  /**
   * Display session information
   */
  displaySessionInfo() {
    const stats = this.getSessionStats();
    console.log('\n📊 Session Statistics:');
    console.log(`  • Interactions: ${stats.interactions}`);
    console.log(`  • Summaries: ${stats.summaries}`);
    console.log(`  • Next ID: ${stats.nextInteractionId}`);
    console.log(`  • Personality: ${stats.personality}`);
    console.log(`  • Evolution Enabled: ${stats.personalityEvolutionEnabled}`);
    
    if (this.session.summaries.length > 0) {
      console.log('\n📜 Recent Summaries:');
      this.session.summaries.slice(-2).forEach((summary, idx) => {
        console.log(`\n  Summary ${idx + 1} (ID range: ${summary.range.startId}-${summary.range.endId}):`);
        console.log(`  ${summary.text}`);
      });
    }
    console.log();
  }
}

/**
 * Interactive CLI with memory-aware chatbot
 */
export async function startMemoryChatbot(sessionPath = './session.json') {
  const chatbot = new MemoryChatbot(sessionPath, {
    systemPrompt: 'You are a helpful assistant with persistent memory. You have access to summaries of past conversations and can reference important facts and decisions.'
  });

  await chatbot.initialize();
  chatbot.displaySessionInfo();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('💾 Memory-Aware Chatbot Started');
  console.log('Commands: "exit", "info", "clear" (current session), or ask anything\n');

  let isProcessing = false;
  let closed = false;

  const processInput = async (input) => {
    if (isProcessing || closed) return;
    isProcessing = true;

    try {
      if (input.toLowerCase() === 'exit') {
        console.log('Goodbye! Session saved.');
        closed = true;
        rl.close();
        process.exit(0);
        return;
      }

      if (input.toLowerCase() === 'info') {
        chatbot.displaySessionInfo();
        isProcessing = false;
        return;
      }

      if (input.toLowerCase() === 'clear') {
        chatbot.session = {
          interactions: [],
          summaries: [],
          nextId: 1,
          personality: null,
          personalityEvolutionEnabled: true,
          personalityImmutable: false
        };
        await saveSession(chatbot.sessionPath, chatbot.session);
        console.log('✓ Session cleared\n');
        isProcessing = false;
        return;
      }

      console.log('\n⏳ Processing with memory context...');
      const response = await chatbot.chat(input);

      console.log(`\n🤖 [${response.choice.toUpperCase()}]`);

      if (response.choice === 'response') {
        console.log(`Response: ${response.response}`);
        if (response.questionsForUser && response.questions.length > 0) {
          console.log('Questions:');
          response.questions.forEach(q => console.log(`  • ${q}`));
        }
      } else if (response.choice === 'code') {
        console.log(`Language: ${response.language}`);
        console.log(`Code:\n${response.code}`);
      } else if (response.choice === 'terminalCommand') {
        console.log(`Command: ${response.terminalCommand}`);
        console.log(`Reasoning: ${response.commandReasoning}`);
      }

      console.log();
      isProcessing = false;
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}\n`);
      isProcessing = false;
    }
  };

  if (process.stdin.isTTY) {
    // Interactive mode
    const askQuestion = () => {
      if (closed) return;
      rl.question('You: ', async (input) => {
        await processInput(input);
        askQuestion();
      });
    };
    askQuestion();
  } else {
    // Piped input mode
    rl.on('line', async (input) => {
      console.log(`You: ${input}`);
      await processInput(input);
    });

    rl.on('close', () => {
      process.exit(0);
    });
  }
}

export default { MemoryChatbot, startMemoryChatbot };
