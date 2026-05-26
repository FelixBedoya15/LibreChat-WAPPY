const mongoose = require('mongoose');

const canvasSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyInfo',
      required: false,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Archivo de Canvas sin título',
    },
    fileType: {
      type: String,
      enum: ['text', 'excel', 'presentation', 'html'],
      required: true,
    },
    /**
     * content: puede ser:
     * - string (HTML o código plano para text/html)
     * - array de arrays (celdas para excel)
     * - array de objetos (slides para presentation)
     */
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    aiRewriteCount: {
      type: Number,
      default: 0,
    },
    history: [
      {
        version: Number,
        content: mongoose.Schema.Types.Mixed,
        title: String,
        fileType: String,
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const CanvasSession = mongoose.model('CanvasSession', canvasSessionSchema);

module.exports = CanvasSession;

