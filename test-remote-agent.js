import { RemoteAgent } from './lib/remoteAgent.js';

/**
 * Test RemoteAgent with TerminalChatbot Server
 */
async function testRemoteAgent() {
  const serverUrl = 'http://localhost:3002';
  const apiKey = '9K7mxPqY8vRn3zWdL6fHjN2bTcQsXg4uA5eZ1wVhG8pMtJkF7rBnCyDx';

  const agent = new RemoteAgent(serverUrl, apiKey);

  console.log('🤖 Testing RemoteAgent\n');

  try {
    // 1. Check server health
    console.log('1️⃣ Checking server health...');
    const health = await agent.checkHealth();
    console.log(`   Status: ${health.status}`);
    console.log(`   Active Sessions: ${health.activeSessions}\n`);

    // 2. Execute single command
    console.log('2️⃣ Executing single command: ls -la');
    const lsResult = await agent.executeCommand('ls -la');
    console.log(`   Exit Code: ${lsResult.exitCode}`);
    console.log(`   Output length: ${lsResult.stdout?.length || 0} bytes\n`);

    // 3. Queue and execute batch
    console.log('3️⃣ Executing batch commands...');
    const batchResults = await agent
      .queueCommand('pwd')
      .queueCommand('echo "Hello from RemoteAgent"')
      .queueCommand('date')
      .executeBatch();
    
    batchResults.forEach((result, idx) => {
      console.log(`   [${idx + 1}] ${result.command} -> ${result.success ? '✓' : '✗'}`);
    });
    console.log();

    // 4. Execute sequence with dependencies
    console.log('4️⃣ Executing dependent sequence...');
    const sequence = [
      { name: 'findDirs', command: 'find . -maxdepth 1 -type d' },
      { name: 'countFiles', command: 'ls -1 | wc -l' }
    ];
    
    const seqResults = await agent.executeSequence(sequence);
    seqResults.forEach(result => {
      console.log(`   ${result.name}: ${result.success ? '✓' : '✗'}`);
    });
    console.log();

    // 5. Get history
    console.log('5️⃣ Getting execution history...');
    const history = await agent.getHistory(10);
    console.log(`   Total records: ${history.totalRecords}`);
    console.log(`   Recent executions: ${history.history.length}\n`);

    // 6. Get stats
    console.log('6️⃣ Getting execution statistics...');
    const stats = await agent.getStats();
    console.log(`   Stats:`, stats.stats);
    console.log();

    console.log('✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the terminal server is running: node terminal-server.js\n');
    process.exit(1);
  }
}

testRemoteAgent();
