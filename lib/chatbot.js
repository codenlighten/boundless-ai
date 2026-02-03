import { queryOpenAI, queryOpenAIJsonMode } from './openaiWrapper.js';
import { universalAgentResponseSchema } from '../schemas/universalAgent.js';
import readline from 'readline';

/**
 * Universal Chatbot using OpenAI with versatile response types
 * Can handle conversational responses, code generation, and terminal commands
 */
export class UniversalChatbot {
  constructor(options = {}) {
    this.conversationHistory = [];
    // Don't set a default model - let openaiWrapper decide based on LLM_PROVIDER
    this.model = options.model || null;
    this.temperature = options.temperature || 0.7;
    this.systemPrompt = options.systemPrompt || 'You are a helpful assistant that can provide conversational responses, generate code, or suggest terminal commands. Always return valid JSON matching the required schema.';
  }

  /**
   * Send a message to the chatbot and get a structured response
   * @param {string} userMessage - The user's input message
   * @param {object} contextData - Optional context data to include
   * @returns {Promise<object>} Structured response with choice type
   */
  async chat(userMessage, contextData = null) {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    try {
      // Build context if provided
      const options = {
        temperature: this.temperature
      };

      // Only set model if explicitly provided
      if (this.model) {
        options.model = this.model;
      }

      if (contextData) {
        options.context = contextData;
      }

      const response = await queryOpenAI(userMessage, options);

      // Store assistant response in history
      this.conversationHistory.push({
        role: 'assistant',
        content: JSON.stringify(response)
      });

      return response;
    } catch (error) {
      console.error('Chatbot Error:', error.message);
      throw error;
    }
  }

  /**
   * Get conversation history
   * @returns {array} Array of message objects
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}

/**
 * Interactive CLI chatbot for testing
 */
export async function startInteractiveChatbot() {
  const chatbot = new UniversalChatbot({
    systemPrompt: 'You are a helpful assistant. Respond with conversational responses, code suggestions, or terminal commands as appropriate. Always return JSON matching the required schema.'
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🤖 Universal Chatbot Started');
  console.log('Type "exit" to quit, "history" to see conversation, "clear" to clear history\n');

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      if (input.toLowerCase() === 'history') {
        console.log('\n📜 Conversation History:');
        chatbot.getHistory().forEach((msg, idx) => {
          console.log(`${idx + 1}. [${msg.role.toUpperCase()}] ${msg.content.substring(0, 100)}...`);
        });
        console.log();
        askQuestion();
        return;
      }

      if (input.toLowerCase() === 'clear') {
        chatbot.clearHistory();
        console.log('✓ History cleared\n');
        askQuestion();
        return;
      }

      try {
        console.log('\n⏳ Processing...');
        const response = await chatbot.chat(input);
        
        console.log(`\n🤖 [${response.choice.toUpperCase()}]`);
        
        // Display response based on choice type
        if (response.choice === 'response') {
          console.log(`Response: ${response.response}`);
          if (response.questionsForUser && response.questions.length > 0) {
            console.log('Questions:');
            response.questions.forEach(q => console.log(`  • ${q}`));
          }
          if (response.missingContext && response.missingContext.length > 0) {
            console.log('Missing Context:');
            response.missingContext.forEach(m => console.log(`  • ${m}`));
          }
        } else if (response.choice === 'code') {
          console.log(`Language: ${response.language}`);
          console.log(`Explanation: ${response.codeExplanation}`);
          console.log(`Code:\n${response.code}`);
        } else if (response.choice === 'terminalCommand') {
          console.log(`Command: ${response.terminalCommand}`);
          console.log(`Reasoning: ${response.commandReasoning}`);
          console.log(`Requires Approval: ${response.requiresApproval}`);
        }
        
        if (response.continue) {
          console.log('(Agent wants to continue working...)');
        }
        
        console.log();
      } catch (error) {
        console.error(`\n❌ Error: ${error.message}\n`);
      }

      askQuestion();
    });
  };

  askQuestion();
}

export default { UniversalChatbot, startInteractiveChatbot };
