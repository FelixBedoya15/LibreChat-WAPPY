const mongoose = require('mongoose');

const kanbanTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'due_soon', 'overdue', 'done'],
      default: 'todo',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['manual', 'medical_exam', 'soat', 'rtm', 'driver_license', 'training', 'other'],
      default: 'manual',
    },
    referenceId: {
      type: String,
      index: true,
    },
    referenceName: {
      type: String,
      trim: true,
    },
    companyId: {
      type: String,
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const KanbanTask = mongoose.models.KanbanTask || mongoose.model('KanbanTask', kanbanTaskSchema);

module.exports = KanbanTask;
