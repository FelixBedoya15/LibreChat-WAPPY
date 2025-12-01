const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection
const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// Define User Schema (simplified)
const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    username: String,
    role: String,
    accountStatus: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function makeAdmin(email) {
    try {
        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name || user.username} (${user.email})`);
        console.log(`Current role: ${user.role || 'USER'}`);

        user.role = 'ADMIN';
        user.accountStatus = 'active'; // Ensure account is active
        await user.save();

        console.log('\n✅ User promoted to ADMIN successfully!');
        console.log(`New role: ${user.role}`);
        console.log('\nPlease log out and log back in for changes to take effect.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node make-admin.js <user-email>');
    console.log('Example: node make-admin.js user@example.com');
    process.exit(1);
}

makeAdmin(email);
