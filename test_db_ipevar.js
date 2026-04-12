const mongoose = require('mongoose');
const { connectDb } = require('./api/lib/db/connectDb.js');
require('dotenv').config();

async function test() {
    await connectDb();
    
    const ParticipacionIpevarDataSchema = new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        formData: { type: Object, default: {} },
        inboxPublico: { type: Array, default: [] }
    }, { collection: 'participacionipevardatas' });
    
    // Fallback if not found:
    const ParticipacionIpevarData = mongoose.models.ParticipacionIpevarData || mongoose.model('ParticipacionIpevarData', ParticipacionIpevarDataSchema);
    
    const docs = await ParticipacionIpevarData.find({});
    console.log(`Found ${docs.length} docs`);
    docs.forEach(d => {
        console.log(`Doc ID: ${d._id}`);
        console.log(`User ID: ${d.user} (Type: ${typeof d.user}, Constructor: ${d.user?.constructor?.name})`);
        console.log(`Inbox Count: ${d.inboxPublico?.length || 0}`);
    });
    process.exit(0);
}
test().catch(console.error);
