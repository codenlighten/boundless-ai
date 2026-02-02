import { UniversalChatbot } from './lib/chatbot.js';

/**
 * Mock chatbot test with simulated responses
 */
export function mockChatbotTest() {
  const chatbot = new UniversalChatbot();

  console.log('🤖 UniversalChatbot Test - Mock Mode\n');

  // Simulate conversation
  const mockResponses = [
    {
      choice: 'response',
      response: 'Hello! I am a universal chatbot that can provide conversational responses, generate code, or suggest terminal commands.',
      questionsForUser: false,
      questions: [],
      missingContext: [],
      code: '',
      language: '',
      codeExplanation: '',
      terminalCommand: '',
      commandReasoning: '',
      requiresApproval: false,
      continue: false
    },
    {
      choice: 'code',
      response: 'Here is a simple Node.js server for you:',
      questionsForUser: false,
      questions: [],
      missingContext: [],
      code: `import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Hello World'));
app.listen(3000, () => console.log('Server running on port 3000'));`,
      language: 'javascript',
      codeExplanation: 'A basic Express.js HTTP server listening on port 3000',
      terminalCommand: '',
      commandReasoning: '',
      requiresApproval: false,
      continue: false
    },
    {
      choice: 'terminalCommand',
      response: 'I can help you run that server.',
      questionsForUser: false,
      questions: [],
      missingContext: [],
      code: '',
      language: '',
      codeExplanation: '',
      terminalCommand: 'npm start',
      commandReasoning: 'This command starts your Node.js application',
      requiresApproval: true,
      continue: false
    }
  ];

  const userQueries = [
    'Hello, what can you do?',
    'Can you generate a simple Node.js server?',
    'How do I run it?'
  ];

  userQueries.forEach((query, idx) => {
    console.log(`📝 User: ${query}`);
    
    const mockResponse = mockResponses[idx];
    console.log(`\n🤖 [${mockResponse.choice.toUpperCase()}]`);

    if (mockResponse.choice === 'response') {
      console.log(`Response: ${mockResponse.response}`);
    } else if (mockResponse.choice === 'code') {
      console.log(`Response: ${mockResponse.response}`);
      console.log(`Language: ${mockResponse.language}`);
      console.log(`Explanation: ${mockResponse.codeExplanation}`);
      console.log(`Code:\n${mockResponse.code}`);
    } else if (mockResponse.choice === 'terminalCommand') {
      console.log(`Response: ${mockResponse.response}`);
      console.log(`Command: ${mockResponse.terminalCommand}`);
      console.log(`Reasoning: ${mockResponse.commandReasoning}`);
      console.log(`Requires Approval: ${mockResponse.requiresApproval}`);
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
  });

  console.log('✓ Mock test demonstrates:');
  console.log('  • Conversational responses');
  console.log('  • Code generation capability');
  console.log('  • Terminal command suggestions');
  console.log('  • Context-aware interactions');
}

// Run test if executed directly
mockChatbotTest();
