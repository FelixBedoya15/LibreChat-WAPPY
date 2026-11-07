const mongoose = require('mongoose');

const googleFlowSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      default: null,
      index: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    cookies: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    cookieCount: {
      type: Number,
      default: 0,
    },
    apiKey: {
      type: String,
      default: '',
      trim: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    lastTestedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      default: 'cli', // 'cli' | 'manual' | 'api_key'
    },
  },
  { timestamps: true }
);

googleFlowSessionSchema.index({ user: 1, companyId: 1 }, { unique: true });

const GoogleFlowSession =
  mongoose.models.GoogleFlowSession || mongoose.model('GoogleFlowSession', googleFlowSessionSchema);

GoogleFlowSession.collection.dropIndex('user_1').catch(() => {});

module.exports = GoogleFlowSession;
