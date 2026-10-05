const mongoose = require('mongoose');

const userApiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: 'Antigravity MCP Key',
      trim: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    scopes: {
      type: [String],
      default: ['mcp:read', 'mcp:write', 'sgsst', 'profile'],
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

const UserApiKey = mongoose.models.UserApiKey || mongoose.model('UserApiKey', userApiKeySchema);

module.exports = UserApiKey;
