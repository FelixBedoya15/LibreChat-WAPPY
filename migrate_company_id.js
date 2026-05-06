const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = "mongodb://127.0.0.1:27017/LibreChat";

async function migrate() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    const collectionsToUpdate = [
        'perfilcargodatas',
        'perfilsociodemograficodatas',
        'programacapacitacionesdatas',
        'matrizlegaldatas',
        'reporteactosdatas',
        'analisisvulnerabilidaddatas',
        'participacionipevardatas',
        'analisistrabajosegurodatas',
        'metodoowasdatas',
        'permisoalturasdatas',
        'matrizpeligrosdatas',
        'altadirecciondatas',
        'atelannualdatas',
        'investigacionateldatas',
        'liveeditorsessions',
        'gtc45workspacesessions'
    ];

    const usersCursor = db.collection('users').find({});
    let usersProcessed = 0;

    for await (const user of usersCursor) {
        const userId = user._id;

        // Find the oldest company for this user
        const firstCompany = await db.collection('companyinfos').findOne(
            { user: userId },
            { sort: { _id: 1 } }
        );

        if (!firstCompany) {
            continue; // No company info for this user
        }

        const companyId = firstCompany._id;

        for (const collName of collectionsToUpdate) {
            try {
                const result = await db.collection(collName).updateMany(
                    {
                        user: userId,
                        $or: [
                            { companyId: null },
                            { companyId: { $exists: false } }
                        ]
                    },
                    {
                        $set: { companyId: companyId }
                    }
                );
                if (result.modifiedCount > 0) {
                    console.log(`Updated ${result.modifiedCount} documents in ${collName} for user ${userId} to company ${companyId}`);
                }
            } catch (err) {
                // Ignore collection not found errors
                console.log(`Skipped ${collName} or error: ${err.message}`);
            }
        }
        usersProcessed++;
    }

    console.log(`Migration completed. Processed ${usersProcessed} users.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
