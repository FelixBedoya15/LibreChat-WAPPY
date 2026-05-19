const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const docs = await mongoose.connection.db.collection('perfilsociodemograficodatas').find({}).toArray();
  console.log("Total socio docs:", docs.length);
  if (docs.length > 0) {
    console.log("First doc user:", docs[0].user);
    console.log("Workers count:", docs[0].trabajadores?.length);
    console.log("Company ID:", docs[0].companyId);
  }

  const cargos = await mongoose.connection.db.collection('perfilcargodatas').find({}).toArray();
  console.log("Total cargo docs:", cargos.length);
  if (cargos.length > 0) {
    console.log("First cargo doc user:", cargos[0].user);
    console.log("Profiles count:", cargos[0].perfilesList?.length);
  }

  mongoose.disconnect();
}
test().catch(console.error);
