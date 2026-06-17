const mongoose = require('mongoose');

const ComunidadConfigSchema = new mongoose.Schema({
    // Central config document for Comunidad Page global settings
    isGlobalSetting: {
        type: Boolean,
        default: true
    },
    funnelKey: {
        type: String,
        default: 'comunidad',
        unique: true
    },
    videoUrl: {
        type: String,
        default: 'https://www.w3schools.com/html/mov_bbb.mp4',
        trim: true
    },
    requiresPayment: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0
    },
    gatingSeconds: {
        type: Number,
        default: 120
    },
    gatingEnabled: {
        type: Boolean,
        default: true
    },
    downloadableFiles: [
        {
            name: { type: String, required: true },
            url: { type: String, required: true },
            filename: { type: String }
        }
    ],
    whatsappUrl: {
        type: String,
        default: 'https://chat.whatsapp.com/GDoaMdEN5m5GhogIL7TGhy?s=cl&p=i&ilr=4',
        trim: true
    },
    extraVideoUrl1: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle1: {
        type: String,
        default: 'Clase Extra 1',
        trim: true
    },
    extraVideoUrl2: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle2: {
        type: String,
        default: 'Clase Extra 2',
        trim: true
    },
    extraVideoUrl3: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle3: {
        type: String,
        default: 'Clase Extra 3',
        trim: true
    },
    extraVideoUrl4: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle4: {
        type: String,
        default: 'Clase Extra 4',
        trim: true
    },
    extraVideoUrl5: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle5: {
        type: String,
        default: 'Clase Extra 5',
        trim: true
    },
    extraVideoUrl6: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle6: {
        type: String,
        default: 'Clase Extra 6',
        trim: true
    },
    extraVideoUrl7: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle7: {
        type: String,
        default: 'Clase Extra 7',
        trim: true
    },
    extraVideoUrl8: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle8: {
        type: String,
        default: 'Clase Extra 8',
        trim: true
    },
    extraVideoUrl9: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle9: {
        type: String,
        default: 'Clase Extra 9',
        trim: true
    },
    extraVideoUrl10: {
        type: String,
        default: '',
        trim: true
    },
    extraVideoTitle10: {
        type: String,
        default: 'Clase Extra 10',
        trim: true
    },
    showQuickAccessBanner: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Drop old unique index on isGlobalSetting if it exists
if (mongoose.connection) {
    mongoose.connection.on('open', async () => {
        try {
            const collection = mongoose.connection.db.collection('comunidadconfigs');
            const indexes = await collection.indexes();
            const hasOldIndex = indexes.some(idx => idx.name === 'isGlobalSetting_1');
            if (hasOldIndex) {
                await collection.dropIndex('isGlobalSetting_1');
                console.log('[Mongoose Migration] Dropped unique index isGlobalSetting_1 on comunidadconfigs');
            }
        } catch (err) {
            console.error('[Mongoose Migration] Error dropping old index on comunidadconfigs:', err.message);
        }
    });
}

module.exports = mongoose.models.ComunidadConfig || mongoose.model('ComunidadConfig', ComunidadConfigSchema);
