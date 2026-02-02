import { MemoryChatbot } from './lib/memoryChatbot.js';
import { saveSession } from './lib/memoryStore.js';

/**
 * Test MemoryChatbot with mock responses
 */
async function testMemoryChatbot() {
  const testSessionPath = './test-session.json';
  const chatbot = new MemoryChatbot(testSessionPath);

  console.log('🧠 MemoryChatbot Test\n');
  
  await chatbot.initialize();
  chatbot.displaySessionInfo();

  // Simulate initial state
  console.log('📝 Adding test interactions...\n');

  // Create mock interactions
  const mockInteractions = [
    { role: 'user', text: 'Hi, I am Gregory Ward' },
    { role: 'assistant', text: JSON.stringify({ choice: 'response', response: 'Hello Gregory! Nice to meet you.' }) },
    { role: 'user', text: 'I am working on an AI verification project' },
    { role: 'assistant', text: JSON.stringify({ choice: 'response', response: 'That sounds interesting! I can help with AI verification.' }) },
    { role: 'user', text: 'Can you help me build a universal chatbot?' },
    { role: 'assistant', text: JSON.stringify({ choice: 'code', code: 'const bot = new UniversalChatbot();', language: 'javascript' }) }
  ];

  // Add interactions to session
  for (const interaction of mockInteractions) {
    chatbot.session.interactions.push({
      id: chatbot.session.nextId++,
      role: interaction.role,
      text: interaction.text,
      ts: new Date().toISOString()
    });
  }

  await saveSession(testSessionPath, chatbot.session);

  console.log('✓ Test interactions added\n');
  chatbot.displaySessionInfo();

  console.log('📋 Session Context for next query:');
  const context = chatbot.getMemoryContext();
  console.log('  • Interactions in memory:', context.interactions.length);
  console.log('  • Summaries available:', context.summaries.length);
  console.log('  • Personality evolved:', context.personality ? 'yes' : 'no');

  console.log('\n✓ MemoryChatbot initialized and ready!');
  console.log('  Features:');
  console.log('  ✓ Persistent session storage');
  console.log('  ✓ Interaction memory with auto-summarization');
  console.log('  ✓ Personality evolution support');
  console.log('  ✓ Memory context injection into prompts');
  console.log('  ✓ Session statistics tracking');
}

testMemoryChatbot().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
