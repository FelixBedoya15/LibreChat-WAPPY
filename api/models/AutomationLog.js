const mongoose = require('mongoose');

const automationEvidenceFileSchema = new mongoose.Schema(
  {
    workerName: { type: String, default: '' },
    cedula: { type: String, default: '' },
    cargo: { type: String, default: '' },
    portal: { type: String, default: '' },
    title: { type: String, default: '' },
    pdfUrl: { type: String, default: null },
    pdfDownloadUrl: { type: String, default: null },
    pdfAbsoluteUrl: { type: String, default: null },
    pdfFileName: { type: String, default: null },
    imageUrl: { type: String, default: null },
    imageDownloadUrl: { type: String, default: null },
    imageAbsoluteUrl: { type: String, default: null },
    imageFileName: { type: String, default: null },
  },
  { _id: false },
);

const automationLogSchema = new mongoose.Schema(
  {
    automation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Automation',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    agentId: {
      type: String,
      required: true,
    },
    agentName: {
      type: String,
    },
    prompt: {
      type: String,
    },
    runAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['running', 'success', 'failed', 'awaiting_approval', 'rejected'],
      default: 'running',
      index: true,
    },
    result: {
      type: String,
    },
    error: {
      type: String,
    },
    conversationId: {
      type: String,
    },
    evidenceFiles: {
      type: [automationEvidenceFileSchema],
      default: [],
    },
    evidences: {
      type: [automationEvidenceFileSchema],
      default: [],
    },
    processedEntityKeys: {
      type: [String],
      default: [],
      index: true,
    },
    dedupWindowUsed: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

const AutomationLog =
  mongoose.models.AutomationLog || mongoose.model('AutomationLog', automationLogSchema);

module.exports = AutomationLog;

