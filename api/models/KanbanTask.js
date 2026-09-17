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
      enum: [
        'manual',
        'medical_exam',
        'soat',
        'rtm',
        'driver_license',
        'training',
        'audit_finding',
        'auditoria_finding',
        'diagnostico_finding',
        'alta_direccion_finding',
        'unsafe_act_finding',
        'ipevar_finding',
        'atel_finding',
        'ats_finding',
        'alturas_finding',
        'ergonomia_finding',
        'vulnerabilidad_finding',
        'pesv_inspection_finding',
        'heights_inspection_finding',
        'other',
      ],
      default: 'manual',
    },
    priority: {
      type: String,
      enum: ['alta', 'media', 'baja'],
      default: 'media',
    },
    actionType: {
      type: String,
      enum: ['correctiva', 'preventiva', 'mejora'],
      default: 'correctiva',
    },
    sourceModule: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: String,
      trim: true,
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
