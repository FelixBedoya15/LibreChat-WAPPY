require('dotenv').config();
const mongoose = require('mongoose');
const SomosSST = require('../api/app/clients/tools/structured/SomosSST');

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Retrieve a user ID to test
    const PerfilSociodemograficoData = mongoose.model('PerfilSociodemograficoData', new mongoose.Schema({}, { strict: false }), 'perfilsociodemograficodatas');
    const profile = await PerfilSociodemograficoData.findOne({}).lean();
    if (!profile) {
      console.log("No profile found in database. Running with a mock user ID for resilience check.");
      const mockFields = {
        req: {
          user: {
            id: new mongoose.Types.ObjectId().toString()
          }
        }
      };
      const mockTool = new SomosSST(mockFields);
      console.log("\n--- TESTING ACTION (MOCK): resumen_empresa ---");
      const resultResumen = await mockTool._call({ accion: 'resumen_empresa' });
      console.log(JSON.stringify(JSON.parse(resultResumen), null, 2));
      process.exit(0);
    }
    const testUserId = profile.user;
    console.log("Testing with User ID:", testUserId);

    // Initialize the SomosSST tool with real user
    const fields = {
      req: {
        user: {
          id: testUserId
        }
      }
    };
    const tool = new SomosSST(fields);

    console.log("\n--- TESTING ACTION: resumen_empresa ---");
    const resultResumen = await tool._call({ accion: 'resumen_empresa' });
    console.log(JSON.stringify(JSON.parse(resultResumen), null, 2));

    console.log("\n--- TESTING ACTION: listar_trabajadores ---");
    const resultListar = await tool._call({ accion: 'listar_trabajadores' });
    console.log(JSON.stringify(JSON.parse(resultListar), null, 2));

    if (profile.trabajadores && profile.trabajadores.length > 0) {
      const testWorkerName = profile.trabajadores[0].nombre;
      console.log(`\n--- TESTING ACTION: consultar_expediente_integral for worker "${testWorkerName}" ---`);
      const resultExpediente = await tool._call({ accion: 'consultar_expediente_integral', nombre_o_cargo: testWorkerName });
      console.log(JSON.stringify(JSON.parse(resultExpediente), null, 2));
    } else {
      console.log("No workers in profile to test consultar_expediente_integral.");
    }

  } catch (e) {
    console.error("Error running test:", e);
  }
  process.exit(0);
};

run();
