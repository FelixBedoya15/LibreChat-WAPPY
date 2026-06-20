const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat');
        console.log('Connected to DB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('perfilcargodatas');
        const docs = await collection.find({}).toArray();
        
        console.log(`Found ${docs.length} profile documents`);
        
        docs.forEach(doc => {
            console.log('--- Document ---');
            console.log('User ID:', doc.user);
            console.log('Company ID:', doc.companyId);
            console.log('Number of profiles:', doc.perfilesList?.length);
            if (doc.perfilesList && doc.perfilesList.length > 0) {
                console.log('First profile keys:', Object.keys(doc.perfilesList[0]));
                console.log('First profile data snippet:', JSON.stringify(doc.perfilesList[0]).substring(0, 1000));
            }
        });
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
