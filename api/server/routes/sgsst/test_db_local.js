const mongoose = require('mongoose');
const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat');
        console.log('Connected to Local MongoDB!');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};
run();
