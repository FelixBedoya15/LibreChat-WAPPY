const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(Object.keys(mongoose.models));
    process.exit(0);
}
run();
