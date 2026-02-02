/**
 * Test client for MemoryChatbot Server
 */

async function testServer() {
  const baseUrl = 'http://localhost:3001';
  const sessionId = 'test-session-' + Date.now();

  console.log('🧪 Testing MemoryChatbot Server\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing /health endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    console.log('✓ Health:', health.status);
    console.log(`  Active Sessions: ${health.activeSessions}\n`);

    // Test 2: Chat message
    console.log('2️⃣ Testing POST /chat...');
    const chatRes = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: 'Hi! What is your name?'
      })
    });
    const chatData = await chatRes.json();
    console.log('✓ Response choice:', chatData.response.choice);
    console.log('  Message:', chatData.response.response.substring(0, 80) + '...\n');

    // Test 3: Get session info
    console.log('3️⃣ Testing GET /session/:sessionId...');
    const sessionRes = await fetch(`${baseUrl}/session/${sessionId}`);
    const sessionData = await sessionRes.json();
    console.log('✓ Interactions:', sessionData.stats.interactions);
    console.log(`  Summaries: ${sessionData.stats.summaries}\n`);

    // Test 4: Get history
    console.log('4️⃣ Testing GET /session/:sessionId/history...');
    const historyRes = await fetch(`${baseUrl}/session/${sessionId}/history`);
    const historyData = await historyRes.json();
    console.log('✓ Total interactions:', historyData.totalInteractions);
    console.log(`  Recent messages: ${historyData.interactions.length}\n`);

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Give server time to start
setTimeout(testServer, 2000);
