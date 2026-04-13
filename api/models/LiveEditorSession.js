const mongoose = require('mongoose');

const liveEditorSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    /**
     * content: el contenido HTML enriquecido del documento activo.
     * El agente escribe directamente aquí vía la tool EditorLive.
     */
    content: {
      type: String,
      default: '',
    },
    /**
     * fileName: nombre descriptivo del documento (ej: "Política SST – ACME S.A.S.")
     */
    fileName: {
      type: String,
      default: 'Documento sin título',
    },
    /**
     * contentUpdatedAt: timestamp de la última vez que el agente o el usuario
     * modificó el contenido. El panel usa esto para el polling de sincronización.
     */
    contentUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const LiveEditorSession = mongoose.model('LiveEditorSession', liveEditorSessionSchema);

module.exports = LiveEditorSession;
