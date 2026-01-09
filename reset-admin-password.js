const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Define User Schema 
const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    username: String,
    password: { type: String, required: true },
    role: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function resetPassword(email, newPassword) {
    try {
        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name || user.username} (${user.email})`);

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        user.password = hash;
        await user.save();

        console.log('\n✅ Password updated successfully!');
        console.log('You can now log in with the new password.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Credentials provided by user
const email = process.argv[2] || 'wappyinteractivo@gmail.com';
const password = process.argv[3] || 'Felix.Bedoya15W';

console.log(`Using email: ${email}`);
// Don't log the password

resetPassword(email, password);
