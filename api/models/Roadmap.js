const mongoose = require('mongoose');

const roadmapSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['Nuevo', 'Mejora', 'Corrección', 'Anuncio'],
      default: 'Nuevo',
    },
  },
  { timestamps: true }
);

const Roadmap = mongoose.models.Roadmap || mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
