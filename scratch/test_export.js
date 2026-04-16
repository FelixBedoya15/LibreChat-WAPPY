require('dotenv').config();
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname, '..') });
const mongoose = require('mongoose');
const { connectDb } = require('~/db');

const test = async () => {
    try {
        await connectDb();
        console.log('Connected to DB');
        
        // Load models
        require('~/models/CompanyInfo');
        const CompanyInfo = mongoose.model('CompanyInfo');
        const User = mongoose.model('User');
        
        console.log('Fetching company info...');
        const companyInfos = await CompanyInfo.find({}).lean();
        console.log(`Found ${companyInfos.length} company info records`);
        
        console.log('Fetching users...');
        const users = await User.find({}, 'email name username').lean();
        console.log(`Found ${users.length} users`);
        
        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
        });

        const result = companyInfos.map(info => ({
            ...info,
            userEmail: userMap[info.user]?.email || 'N/A',
            userName: userMap[info.user]?.name || userMap[info.user]?.username || 'N/A',
        }));

        console.log('Final result count:', result.length);
        if (result.length > 0) {
            console.log('Sample record:', result[0]);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
};

test();
