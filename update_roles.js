const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const db = mongoose.connection.db;

    const res1 = await db.collection('roles').updateOne({ name: 'USER' }, { $set: { 'permissions.SGSST.USE': false } });
    console.log('USER updated:', res1);

    const res2 = await db.collection('roles').updateOne({ name: 'USER_GO' }, { $set: { 'permissions.SGSST.USE': false } });
    console.log('USER_GO updated:', res2);

    process.exit();
}
run().catch(err => console.error(err));
