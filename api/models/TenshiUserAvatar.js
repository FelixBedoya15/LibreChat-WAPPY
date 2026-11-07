const mongoose = require('mongoose');
const TenshiConfig = require('./TenshiConfig');

const tenshiUserAvatarSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        avatarId: {
            type: String,
            default: '',
        },
        name: {
            type: String,
            default: '',
        },
        gender: {
            type: String,
            enum: ['masculino', 'femenino', 'neutro', ''],
            default: '',
        },
        voice: {
            type: String,
            default: '',
        },
        personality: {
            type: String,
            default: '',
        },
        personalityPreset: {
            type: String,
            default: 'consultor',
        },
        isCustomized: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const TenshiUserAvatar =
    mongoose.models.TenshiUserAvatar || mongoose.model('TenshiUserAvatar', tenshiUserAvatarSchema);

TenshiUserAvatar.resolveEffectiveAvatarProfile = async function (userId, existingConfig = null) {
    let config = existingConfig;
    if (!config) {
        try {
            config = (await TenshiConfig.findOne().lean()) || {};
        } catch (_) {
            config = {};
        }
    }

    const defaults = {
        avatarId: config.defaultAvatarId || 'gato',
        name: config.name || 'Tenshi',
        gender: config.defaultGender || 'masculino',
        voice: config.defaultVoice || 'Puck',
        personality:
            config.defaultPersonality ||
            'Amigable, proactivo, experto en SG-SST y cercano con el usuario.',
    };

    let userDoc = null;
    if (userId) {
        const cleanUserId =
            typeof userId === 'object' && !(userId instanceof mongoose.Types.ObjectId)
                ? String(userId.id || userId._id || '')
                : String(userId);
        if (cleanUserId && mongoose.Types.ObjectId.isValid(cleanUserId)) {
            try {
                userDoc = await TenshiUserAvatar.findOne({ user: cleanUserId }).lean();
            } catch (_) {
                userDoc = null;
            }
        }
    }

    const effective = {
        avatarId: userDoc?.isCustomized && userDoc?.avatarId ? userDoc.avatarId : defaults.avatarId,
        name: userDoc?.isCustomized && userDoc?.name?.trim() ? userDoc.name.trim() : defaults.name,
        gender: userDoc?.isCustomized && userDoc?.gender ? userDoc.gender : defaults.gender,
        voice: userDoc?.isCustomized && userDoc?.voice ? userDoc.voice : defaults.voice,
        personality:
            userDoc?.isCustomized && userDoc?.personality?.trim()
                ? userDoc.personality.trim()
                : defaults.personality,
        personalityPreset: userDoc?.personalityPreset || 'consultor',
        isCustomized: Boolean(userDoc?.isCustomized),
    };

    return {
        userAvatar: userDoc || null,
        defaults,
        effective,
    };
};

module.exports = TenshiUserAvatar;
