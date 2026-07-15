const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique registration per user per event
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = { EventRegistration };
