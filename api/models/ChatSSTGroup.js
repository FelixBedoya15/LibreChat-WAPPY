const mongoose = require('mongoose');

const chatSSTGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    companyId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChatSSTGroup = mongoose.models.ChatSSTGroup || mongoose.model('ChatSSTGroup', chatSSTGroupSchema);

module.exports = ChatSSTGroup;
