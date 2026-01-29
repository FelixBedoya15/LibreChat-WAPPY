const mongoose = require('mongoose');
const { User } = require('./api/db/models');

require('dotenv').config();

const MONGO_URI = 'mongodb://127.0.0.1:27017/LibreChat';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const activeDate = new Date('2026-01-27T00:00:00.000Z');
        const inactiveDate = new Date();
        inactiveDate.setMonth(inactiveDate.getMonth() + 2);

        console.log(`Setting activeAt: ${activeDate.toISOString()}`);
        console.log(`Setting inactiveAt: ${inactiveDate.toISOString()}`);

        const result = await User.updateMany(
            { role: { $ne: 'ADMIN' } },
            {
                $set: {
                    activeAt: activeDate,
                    inactiveAt: inactiveDate
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating users:', error);
        process.exit(1);
    }
};

run();
