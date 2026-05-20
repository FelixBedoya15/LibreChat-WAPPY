require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const CompanyInfo = mongoose.model('CompanyInfo', new mongoose.Schema({}, { strict: false }), 'companyinfos');
    const PerfilSociodemograficoData = mongoose.model('PerfilSociodemograficoData', new mongoose.Schema({}, { strict: false }), 'perfilsociodemograficodatas');
    const SgsstWorker = mongoose.model('SgsstWorker', new mongoose.Schema({}, { strict: false }), 'sgsstworkers');

    const companies = await CompanyInfo.find({}).lean();
    console.log(`\n=== COMPANIES (${companies.length}) ===`);
    companies.forEach(c => {
      console.log(`Company ID: ${c._id} | Name: "${c.companyName}" | Active: ${c.isActive} | User: ${c.user}`);
    });

    const profiles = await PerfilSociodemograficoData.find({}).lean();
    console.log(`\n=== PERFIL SOCIODEMOGRAFICO DOCS (${profiles.length}) ===`);
    profiles.forEach(p => {
      console.log(`Doc ID: ${p._id} | User: ${p.user} | CompanyId: ${p.companyId}`);
      if (p.trabajadores) {
        console.log(`  Trabajadores (${p.trabajadores.length}):`);
        p.trabajadores.forEach(w => {
          console.log(`    - [${w.identificacion}] ${w.nombre} | Cargo: ${w.cargo}`);
        });
      } else {
        console.log("  No trabajadores array");
      }
    });

    const workers = await SgsstWorker.find({}).lean();
    console.log(`\n=== SGSST WORKERS (${workers.length}) ===`);
    workers.forEach(w => {
      console.log(`Worker ID: ${w._id} | User: ${w.user} | CompanyId: ${w.companyId} | Doc: ${w.documento} | Name: ${w.nombre} | PerfilId: ${w.perfilId}`);
    });

  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
