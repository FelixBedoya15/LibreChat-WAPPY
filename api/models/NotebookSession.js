const mongoose = require('mongoose');

const notebookSessionSchema = new mongoose.Schema(
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
      default: 'extension', // 'extension' | 'manual' | 'cli'
    },
  },
  { timestamps: true }
);

const NotebookSession =
  mongoose.models.NotebookSession || mongoose.model('NotebookSession', notebookSessionSchema);

module.exports = NotebookSession;
