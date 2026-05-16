require('dotenv').config({path: '/Users/venta/Documents/GitHub/LibreChat-WAPPY/.env'});
const mongoose = require('mongoose');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        
        const PerfilSocioModel = mongoose.model('PerfilSociodemograficoData', new mongoose.Schema({}, { strict: false }));
        const SgsstWorker = mongoose.model('SgsstWorker', new mongoose.Schema({}, { strict: false }));
        
        const socioData = await PerfilSocioModel.find({}).lean();
        console.log(`Found ${socioData.length} PerfilSociodemograficoData documents.`);
        
        let foundWorkers = 0;
        socioData.forEach(doc => {
            console.log(`\nUser ID: ${doc.user}, Company ID: ${doc.companyId}`);
            if (doc.trabajadores && doc.trabajadores.length > 0) {
                console.log(`  Trabajadores count: ${doc.trabajadores.length}`);
                doc.trabajadores.forEach(w => {
                    console.log(`  - Nombre: ${w.nombre}, Cargo: '${w.cargo}', Documento: ${w.identificacion}`);
                    if (w.cargo === 'Gerente General') foundWorkers++;
                });
            } else {
                console.log("  No trabajadores array found.");
            }
        });
        
        console.log(`\nFound ${foundWorkers} workers with cargo 'Gerente General' in Sociodemografico.`);
        
        const sgsstWorkers = await SgsstWorker.find({}).lean();
        console.log(`\nFound ${sgsstWorkers.length} SgsstWorker documents total.`);
        sgsstWorkers.forEach(w => {
            console.log(`- Nombre: ${w.nombre}, Documento: ${w.documento}, PerfilId: ${w.perfilId}, Company: ${w.companyId}`);
        });

    } catch (e) {
        console.error("DB Error:", e);
    }
    process.exit(0);
}
run();
