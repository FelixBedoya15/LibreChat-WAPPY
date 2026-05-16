require('dotenv').config({path: '../../../../.env'});
const mongoose = require('mongoose');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const PerfilSocioModel = mongoose.model('PerfilSociodemograficoData', new mongoose.Schema({}, { strict: false }));
        
        const data = await PerfilSocioModel.find({}).lean();
        console.log('Docs found:', data.length);
        if (data.length > 0) {
            console.log('companyId in db:', data[0].companyId);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
