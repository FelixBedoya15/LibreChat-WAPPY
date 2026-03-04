require('dotenv').config();
const path = require('path');
require('module-alias')({ base: path.resolve(__dirname) });

const { connectDb } = require('./api/db');
const { Role } = require('./api/db/models');

async function fixRoles() {
    console.log('Connecting to DB...');
    await connectDb();

    console.log('Updating USER role SGSST permissions to false...');
    const result1 = await Role.updateOne(
        { name: 'USER' },
        {
            $set: { 'permissions.SGSST.USE': false }
        }
    );
    console.log('USER update result:', result1);

    console.log('Updating USER_GO role SGSST permissions to false...');
    const result2 = await Role.updateOne(
        { name: 'USER_GO' },
        {
            $set: { 'permissions.SGSST.USE': false }
        }
    );
    console.log('USER_GO update result:', result2);

    console.log('Done!');
    process.exit(0);
}

fixRoles().catch(err => {
    console.error(err);
    process.exit(1);
});
