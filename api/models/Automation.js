const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      default: 'SYSTEM_PRESET',
      index: true,
    },
    isSystemPreset: {
      type: Boolean,
      default: false,
      index: true,
    },
    presetKey: {
      type: String,
      trim: true,
      index: true,
    },
    presetCategory: {
      type: String,
      default: 'general',
      trim: true,
    },
    presetDescription: {
      type: String,
      default: '',
      trim: true,
    },
    workflowNodes: {
      trigger: { type: String, default: 'schedule_cron' },
      triggers: { type: [String], default: ['schedule_cron'] },
      aiEngine: { type: String, enum: ['wappy', 'antigravity'], default: 'wappy' },
      aiModel: { type: String, default: 'gemini-3.6-flash' },
      memoryNode: { type: String, default: 'wappy_memory_company' },
      includeIfNode: { type: Boolean, default: true },
      inputs: { type: [String], default: [] },
      hitos: { type: [String], default: [] },
      outputs: { type: [String], default: [] },
      canvasLayout: { type: mongoose.Schema.Types.Mixed, default: null },
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
      dayOfWeek: { type: mongoose.Schema.Types.Mixed, default: 1 }, // 0 = Sunday, 1 = Monday, or array of numbers [1, 3, 5]
      dayOfMonth: { type: Number, default: 1 },
      intervalHours: { type: Number, default: 1 },
    },
    emails: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused_error'],
      default: 'active',
      index: true,
    },
    lastRunAt: {
      type: Date,
    },
    lastRunStatus: {
      type: String,
      enum: ['success', 'failed', 'running', 'stopped'],
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
