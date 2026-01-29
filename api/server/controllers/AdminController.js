const mongoose = require('mongoose');
const User = mongoose.model('User');
const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'email name username createdAt provider role accountStatus isApproved inactiveAt activeAt');
        // Map legacy isApproved to accountStatus if needed
        const mappedUsers = users.map(user => {
            const userObj = user.toObject();
            if (!userObj.accountStatus) {
                userObj.accountStatus = userObj.isApproved === false ? 'pending' : 'active';
            }
            return userObj;
        });
        res.status(200).json(mappedUsers);
    } catch (err) {
        logger.error('[getAllUsers]', err);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

const createUser = async (req, res) => {
    try {
        const { email, password, name, username, role, accountStatus } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            username,
            role: role || SystemRoles.USER,
            accountStatus: accountStatus || 'active',
            provider: 'local',
            emailVerified: true, // Admin created users are verified
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (err) {
        logger.error('[createUser]', err);
        res.status(500).json({ message: 'Error creating user' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { userId, role, accountStatus, name, username, password, inactiveAt, activeAt } = req.body;
        logger.info(`[AdminController] Updating user ${userId}:`, { role, accountStatus, inactiveAt, activeAt });

        const updateData = {};
        if (role) updateData.role = role;
        if (accountStatus) updateData.accountStatus = accountStatus;
        if (inactiveAt !== undefined) updateData.inactiveAt = inactiveAt ? new Date(inactiveAt) : null;
        if (activeAt !== undefined) updateData.activeAt = activeAt ? new Date(activeAt) : null;
        if (name) updateData.name = name;
        if (username) updateData.username = username;
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            updateData.password = bcrypt.hashSync(password, salt);
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (err) {
        logger.error('[updateUser]', err);
        res.status(500).json({ message: 'Error updating user' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        // Prevent deleting self
        if (req.user._id.toString() === userId) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        logger.error('[deleteUser]', err);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

const bulkUpdateUsers = async (req, res) => {
    try {
        const { userIds, activeAt, inactiveAt } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'No users provided' });
        }

        const updateData = {};
        // Allow setting to null/undefined to clear dates, or valid dates
        // If undefined in body, do not update. If null, clear.
        if (activeAt !== undefined) updateData.activeAt = activeAt ? new Date(activeAt) : null;
        if (inactiveAt !== undefined) updateData.inactiveAt = inactiveAt ? new Date(inactiveAt) : null;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No updates provided' });
        }

        const result = await User.updateMany(
            { _id: { $in: userIds } },
            { $set: updateData }
        );

        res.status(200).json({
            message: 'Users updated successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        logger.error('[bulkUpdateUsers]', err);
        res.status(500).json({ message: 'Error updating users' });
    }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser, bulkUpdateUsers };
