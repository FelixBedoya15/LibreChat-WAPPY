const mongoose = require('mongoose');
const User = mongoose.model('User');
const { logger } = require('@librechat/data-schemas');

const getPendingUsers = async (req, res) => {
    try {
        const users = await User.find({ isApproved: false }, 'email name username createdAt provider');
        res.status(200).json(users);
    } catch (err) {
        logger.error('[getPendingUsers]', err);
        res.status(500).json({ message: 'Error fetching pending users' });
    }
};

const approveUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        await User.findByIdAndUpdate(userId, { isApproved: true });
        res.status(200).json({ message: 'User approved' });
    } catch (err) {
        logger.error('[approveUser]', err);
        res.status(500).json({ message: 'Error approving user' });
    }
};

module.exports = { getPendingUsers, approveUser };
