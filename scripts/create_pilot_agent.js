const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function createPilotAgent() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat');
    console.log("Conectado a MongoDB local.");
    
    const db = mongoose.connection.db;
    const collection = db.collection('agents');
    
    const promptPath = path.join(__dirname, '../Agentes/Agentes Wappy/agente_piloto_gemini3.md');
    const instructions = fs.readFileSync(promptPath, 'utf8');
    
    const agentName = "Agente Piloto SST Gemini 3";
    const existing = await collection.findOne({ name: agentName });
    
    const now = new Date();
    const agentData = {
      name: agentName,
      description: "Agente de prueba piloto optimizado con las guías de instrucción de Gemini 3.",
      instructions: instructions,
      provider: "google",
      model: "gemini-3.5-flash",
      tools: ["canvas"],
      category: "especialistas_riesgos_especificos",
      is_promoted: true,
      order: -1,
      updatedAt: now,
    };
    
    if (existing) {
      await collection.updateOne({ name: agentName }, { $set: agentData });
      console.log("¡Agente Piloto actualizado con éxito en MongoDB!");
    } else {
      const id = 'agent_piloto_gemini3_' + Date.now();
      agentData.id = id;
      agentData.createdAt = now;
      agentData.versions = [{
        name: agentName,
        description: agentData.description,
        instructions: instructions,
        provider: "google",
        model: "gemini-3.5-flash",
        tools: ["canvas"],
        createdAt: now,
        updatedAt: now
      }];
      await collection.insertOne(agentData);
      console.log("¡Agente Piloto creado con éxito en MongoDB con ID:", id, "!");
    }
  } catch (err) {
    console.error("Error creando el agente piloto:", err);
  } finally {
    process.exit(0);
  }
}

createPilotAgent();
