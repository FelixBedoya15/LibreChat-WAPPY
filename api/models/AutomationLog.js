const mongoose = require('mongoose');

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
      enum: ['running', 'success', 'failed'],
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
  },
  {
    timestamps: true,
  }
);

const AutomationLog = mongoose.models.AutomationLog || mongoose.model('AutomationLog', automationLogSchema);

module.exports = AutomationLog;
