const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    agentId: {
      type: String,
      required: true,
      index: true,
    },
    agentName: {
      type: String,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    scheduleType: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'hourly'],
      default: 'daily',
    },
    scheduleConfig: {
      hour: { type: Number, default: 8 },
      minute: { type: Number, default: 0 },
      dayOfWeek: { type: Number, default: 1 }, // 0 = Sunday, 1 = Monday, etc.
      dayOfMonth: { type: Number, default: 1 },
      intervalHours: { type: Number, default: 1 },
    },
    emails: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    lastRunAt: {
      type: Date,
    },
    lastRunStatus: {
      type: String,
      enum: ['success', 'failed', 'running'],
    },
    lastRunResult: {
      type: String,
    },
    nextRunAt: {
      type: Date,
      index: true,
    },
    conversationId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Automation = mongoose.models.Automation || mongoose.model('Automation', automationSchema);

module.exports = Automation;
