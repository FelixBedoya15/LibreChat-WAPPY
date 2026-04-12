const mongoose = require('mongoose');
const { connectDb } = require('./api/lib/db/connectDb.js');
require('dotenv').config();
const { ReporteActosData, ParticipacionIpevarData } = require('./api/server/routes/sgsst/sgsstBaseModels.js') || {};

async function test() {
    await connectDb();
    
    const Actos = mongoose.model('ReporteActosData');
    const Ipevar = mongoose.model('ParticipacionIpevarData');
    
    const actos = await Actos.find({});
    console.log(`ReporteActosData Count: ${actos.length}`);
    actos.forEach(a => {
        console.log(`- ID: ${a._id}, User: ${a.user} (Type: ${typeof a.user}, Constructor: ${a.user?.constructor?.name}), Inbox: ${a.inboxPublico?.length}`);
    });
    
    console.log(`---`);
    
    const ipevar = await Ipevar.find({});
    console.log(`ParticipacionIpevarData Count: ${ipevar.length}`);
    ipevar.forEach(i => {
        console.log(`- ID: ${i._id}, User: ${i.user} (Type: ${typeof i.user}, Constructor: ${i.user?.constructor?.name}), Inbox: ${i.inboxPublico?.length}`);
    });
    
    process.exit(0);
}
test().catch(console.error);
