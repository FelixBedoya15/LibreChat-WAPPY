const mongoose = require('mongoose');

const liveDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Documento sin título'
    },
    content: {
      type: String,
      required: true,
      default: ''
    },
    originalFileName: {
      type: String,
      required: false
    },
    originalFileType: {
      type: String,
      required: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
liveDocumentSchema.index({ user: 1, updatedAt: -1 });

const LiveDocument = mongoose.model('LiveDocument', liveDocumentSchema);

module.exports = LiveDocument;
