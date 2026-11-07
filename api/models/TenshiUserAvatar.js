const mongoose = require('mongoose');
const TenshiConfig = require('./TenshiConfig');

const tenshiUserAvatarSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        companyId: {
            type: String,
            default: null,
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

tenshiUserAvatarSchema.index({ user: 1, companyId: 1 }, { unique: true });

const LEGACY_SST_PERSONALITY_MAP = {
    'Amigable, proactivo, experto en SG-SST y cercano con el usuario.':
        'Amigable, carismático, servicial y siempre con buena energía para ayudarte.',
    'Ingeniero preventor alerta, detallista en inspecciones de campo, práctico y enfocado en controlar riesgos SST.':
        'Ingenioso, observador, ágil y súper práctico para resolver cualquier duda al instante.',
    'Compañero leal, entusiasta, protector de la seguridad en terreno y motivador del equipo de trabajo.':
        'Leal, entusiasta, alegre y motivador; un gran parcero dispuesto a acompañarte en todo.',
    'Ejecutiva, diplomática, estructurada y serena. Especialista en comunicación asertiva, comités y alta dirección.':
        'Serena, empática, clara al hablar y con un trato cálido, cordial y armonioso.',
    'Sereno, empático y paciente. Experto en bienestar laboral, riesgo psicosocial y acompañamiento tranquilo paso a paso.':
        'Tranquilo, relajado, paciente y descomplicado; explica todo paso a paso con total calma.',
};

const cleanAvatarName = (rawName, fallback = 'Tenshi') => {
    const str = String(rawName || '').trim();
    if (!str) return fallback;
    return str.split('—')[0].split(' - ')[0].trim() || fallback;
};

const cleanAvatarPersonality = (rawText) => {
    const str = String(rawText || '').trim();
    if (!str) return 'Amigable, carismático, servicial y siempre con buena energía para ayudarte.';
    return LEGACY_SST_PERSONALITY_MAP[str] || str;
};

tenshiUserAvatarSchema.statics.resolveEffectiveAvatarProfile = async function (
    userId,
    existingConfig = null,
    companyId = null
) {
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
        name: cleanAvatarName(config.name, 'Tenshi'),
        gender: config.defaultGender || 'masculino',
        voice: config.defaultVoice || 'Puck',
        personality: cleanAvatarPersonality(config.defaultPersonality),
    };

    let userAvatar = null;
    let effectiveCompanyId = companyId ? String(companyId).trim() : null;

    if (userId) {
        const cleanUserId =
            typeof userId === 'object' && !(userId instanceof mongoose.Types.ObjectId)
                ? String(userId.id || userId._id || '')
                : String(userId);
        if (cleanUserId && mongoose.Types.ObjectId.isValid(cleanUserId)) {
            try {
                if (!effectiveCompanyId && mongoose.models.CompanyInfo) {
                    const activeComp = await mongoose.models.CompanyInfo.findOne({
                        user: cleanUserId,
                        isActive: true,
                    })
                        .select('_id')
                        .lean()
                        .catch(() => null);
                    if (activeComp?._id) effectiveCompanyId = String(activeComp._id);
                }

                if (effectiveCompanyId) {
                    userAvatar = await this.findOne({
                        user: cleanUserId,
                        companyId: effectiveCompanyId,
                    }).lean();
                }
                if (!userAvatar) {
                    userAvatar = await this.findOne({
                        user: cleanUserId,
                        $or: [
                            { companyId: null },
                            { companyId: '' },
                            { companyId: { $exists: false } },
                        ],
                    }).lean();
                }
            } catch (_) {
                userAvatar = null;
            }
        }
    }

    if (userAvatar) {
        userAvatar.name = cleanAvatarName(userAvatar.name, '');
        if (userAvatar.personality) {
            userAvatar.personality = cleanAvatarPersonality(userAvatar.personality);
        }
    }

    const effective = {
        avatarId:
            userAvatar?.isCustomized && userAvatar?.avatarId
                ? userAvatar.avatarId
                : defaults.avatarId,
        name:
            userAvatar?.isCustomized && userAvatar?.name?.trim()
                ? cleanAvatarName(userAvatar.name, defaults.name)
                : defaults.name,
        gender:
            userAvatar?.isCustomized && userAvatar?.gender ? userAvatar.gender : defaults.gender,
        voice: userAvatar?.isCustomized && userAvatar?.voice ? userAvatar.voice : defaults.voice,
        personality:
            userAvatar?.isCustomized && userAvatar?.personality?.trim()
                ? cleanAvatarPersonality(userAvatar.personality)
                : defaults.personality,
        personalityPreset: userAvatar?.personalityPreset || 'consultor',
        isCustomized: Boolean(userAvatar?.isCustomized),
        companyId: effectiveCompanyId,
    };

    return {
        companyId: effectiveCompanyId,
        userAvatar: userAvatar || null,
        defaults,
        effective,
    };
};

const TenshiUserAvatar =
    mongoose.models.TenshiUserAvatar || mongoose.model('TenshiUserAvatar', tenshiUserAvatarSchema);

TenshiUserAvatar.resolveEffectiveAvatarProfile =
    tenshiUserAvatarSchema.statics.resolveEffectiveAvatarProfile.bind(TenshiUserAvatar);

if (TenshiUserAvatar.collection) {
    TenshiUserAvatar.collection.dropIndex('user_1').catch(() => {});
}

module.exports = TenshiUserAvatar;
