const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('[Error] MONGO_URI is not set in environment.');
  process.exit(1);
}

const targetEmail = (process.argv[2] || 'cristhian@mauricioposadac.com').toLowerCase().trim();
const targetPassword = process.argv[3] || '3106415385'; // Default password or custom passed as argument
const targetName = 'Cristhian Mauricio Posada';

async function run() {
  try {
    console.log(`[Admin Setup] Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log(`[Admin Setup] Connected successfully.`);

    const { userSchema } = require('@librechat/data-schemas');
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    let user = await User.findOne({ email: targetEmail });

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(targetPassword, salt);

    if (!user) {
      console.log(`[Admin Setup] User ${targetEmail} not found. Creating new ADMIN user...`);
      user = new User({
        name: targetName,
        username: targetEmail.split('@')[0],
        email: targetEmail,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        accountStatus: 'active',
        isApproved: true,
        phone: '3106415385',
        phoneNumber: '3106415385'
      });
      await user.save();
      console.log(`[Admin Setup] ✅ Successfully created ADMIN user: ${targetEmail}`);
    } else {
      console.log(`[Admin Setup] User ${targetEmail} found. Updating to ADMIN with verified status...`);
      user.role = 'ADMIN';
      user.emailVerified = true;
      user.accountStatus = 'active';
      user.isApproved = true;
      user.password = hashedPassword;
      user.phone = user.phone || '3106415385';
      user.phoneNumber = user.phoneNumber || '3106415385';
      await user.save();
      console.log(`[Admin Setup] ✅ Successfully updated ADMIN user: ${targetEmail}`);
    }

    console.log(`--------------------------------------------------`);
    console.log(`Email: ${targetEmail}`);
    console.log(`Role: ADMIN`);
    console.log(`Password set to: ${targetPassword}`);
    console.log(`--------------------------------------------------`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Admin Setup] Error:', err);
    process.exit(1);
  }
}

run();
