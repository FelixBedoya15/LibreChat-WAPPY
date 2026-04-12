const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const Actos = mongoose.connection.collection('reporteactosdatas');
    const Ipevar = mongoose.connection.collection('participacionipevardatas');
    
    console.log('--- Actos ---');
    const actos = await Actos.find({}).toArray();
    actos.forEach(a => {
        let type = typeof a.user;
        if (a.user && a.user.constructor && a.user.constructor.name) type = a.user.constructor.name;
        console.log(`ID: ${a._id}, User: ${a.user} (${type}), Inbox Len: ${a.inboxPublico?.length || 0}`);
    });
    
    console.log('\n--- IPEVAR ---');
    const ipevar = await Ipevar.find({}).toArray();
    ipevar.forEach(i => {
        let type = typeof i.user;
        if (i.user && i.user.constructor && i.user.constructor.name) type = i.user.constructor.name;
        console.log(`ID: ${i._id}, User: ${i.user} (${type}), Inbox Len: ${i.inboxPublico?.length || 0}`);
    });

    process.exit(0);
}
test().catch(console.error);
