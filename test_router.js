require('dotenv').config();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function test() {
  const userId = '6921e15be5ed2f3ebc3cde7a'; // Extracted from logs
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const hash = crypto.createHash('sha256');
  hash.update(`test-specialist-${Date.now()}`);
  const conversationId = hash.digest('hex').substring(0, 24);

  // We need to fetch the agent ID from DB
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);
  const agent = await mongoose.connection.collection('agents').findOne({ name: /Psicólog/i });
  if (!agent) {
     console.log('No psychologist agent found!');
     process.exit(1);
  }

  const payload = {
    convoId: conversationId,
    text: "Hola, explícamelo en un párrafo de prueba",
    endpointOption: {
      endpoint: 'agents',
      agent_id: agent._id.toString(),
    },
    ephemeralAgent: {
      tools: agent.tools || [],
    }
  };

  console.log("Calling API...");
  const response = await fetch('http://localhost:3080/api/agents/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let rawStream = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    rawStream += chunk;
    console.log("CHUNK:", chunk);
  }
  console.log("\n--- RAW STREAM ---");
  console.log(rawStream);
  process.exit(0);
}
test();
