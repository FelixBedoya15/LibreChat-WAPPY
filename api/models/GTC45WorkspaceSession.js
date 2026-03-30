const mongoose = require('mongoose');

const gtc45WorkspaceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    matrixRows: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const GTC45WorkspaceSession = mongoose.model('GTC45WorkspaceSession', gtc45WorkspaceSessionSchema);

module.exports = GTC45WorkspaceSession;
