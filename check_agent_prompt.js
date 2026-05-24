const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat');
    console.log("Connected to local MongoDB successfully!");
    
    const db = mongoose.connection.db;
    const collection = db.collection('agents');
    
    // Find Consultor SG-SST agent
    const agent = await collection.findOne({ name: 'Consultor SG-SST' });
    if (!agent) {
      console.log("Agent 'Consultor SG-SST' not found in MongoDB!");
      const agents = await collection.find({}, { projection: { name: 1 } }).toArray();
      console.log("Existing Agents in DB:", agents.map(a => a.name));
    } else {
      console.log("=================== Agent Found ===================");
      console.log("ID:", agent.id || agent._id);
      console.log("Name:", agent.name);
      console.log("Has wappy-card instruction:", agent.instructions ? agent.instructions.includes('wappy-card') : false);
      if (agent.instructions) {
        console.log("Last 800 chars of instructions:\n");
        console.log(agent.instructions.substring(agent.instructions.length - 800));
      } else {
        console.log("No instructions field!");
      }
      console.log("====================================================");
    }
  } catch (err) {
    console.error("Error running script:", err);
  } finally {
    process.exit(0);
  }
}
run();
