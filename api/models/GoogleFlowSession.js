const mongoose = require('mongoose');

const googleFlowSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
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

const GoogleFlowSession =
  mongoose.models.GoogleFlowSession || mongoose.model('GoogleFlowSession', googleFlowSessionSchema);

module.exports = GoogleFlowSession;
