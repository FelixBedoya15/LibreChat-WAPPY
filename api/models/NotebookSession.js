const mongoose = require('mongoose');

const notebookSessionSchema = new mongoose.Schema(
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
    cachedNotebooks: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    notebooksUpdatedAt: {
      type: Date,
      default: null,
    },
    agentNotebooks: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

notebookSessionSchema.index({ user: 1, companyId: 1 }, { unique: true });

const NotebookSession =
  mongoose.models.NotebookSession || mongoose.model('NotebookSession', notebookSessionSchema);

NotebookSession.collection.dropIndex('user_1').catch(() => {});

module.exports = NotebookSession;
