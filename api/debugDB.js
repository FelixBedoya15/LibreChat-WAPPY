const mongoose = require('mongoose');

async function debugDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat');
    console.log("Connected successfully!");

    // Query PerfilSociodemograficoData directly using collection name
    const socioDocs = await mongoose.connection.db.collection('perfilsociodemograficodatas').find({}).toArray();
    console.log(`\n=== PERFIL SOCIODEMOGRÁFICO ===`);
    console.log(`Total documents found: ${socioDocs.length}`);
    
    if (socioDocs.length > 0) {
      socioDocs.forEach((doc, idx) => {
        console.log(`\nDoc #${idx + 1}:`);
        console.log(`- User ID: ${doc.user}`);
        console.log(`- Company ID: ${doc.companyId}`);
        const workers = doc.trabajadores || [];
        console.log(`- Workers count: ${workers.length}`);
        if (workers.length > 0) {
          console.log(`  Sample worker cargo: "${workers[0].cargo}"`);
        }
      });
    }

    const cargoDocs = await mongoose.connection.db.collection('perfilcargodatas').find({}).toArray();
    console.log(`\n=== PERFILES DE CARGO ===`);
    console.log(`Total documents found: ${cargoDocs.length}`);
    
    if (cargoDocs.length > 0) {
      cargoDocs.forEach((doc, idx) => {
        console.log(`\nDoc #${idx + 1}:`);
        console.log(`- User ID: ${doc.user}`);
        console.log(`- Company ID: ${doc.companyId}`);
        const profiles = doc.perfilesList || [];
        console.log(`- Profiles count: ${profiles.length}`);
        if (profiles.length > 0) {
          console.log(`  Sample profile name: "${profiles[0].nombreCargo}"`);
        }
      });
    }

  } catch (error) {
    console.error("Error during DB debug:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

debugDB();
