const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const gtc45WorkspaceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Nueva Matriz GTC-45',
    },
    messages: [messageSchema],
    matrixRows: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const GTC45WorkspaceSession = mongoose.model('GTC45WorkspaceSession', gtc45WorkspaceSessionSchema);

module.exports = GTC45WorkspaceSession;
