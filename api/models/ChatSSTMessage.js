const mongoose = require('mongoose');

const chatSSTMessageSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Opcional para mensajes de bot o sistema
      index: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'bot', 'system', 'admin'],
      default: 'user',
    },
    content: {
      type: String,
      required: true,
    },
    mentions: [
      {
        type: String,
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSSTMessage',
      required: false,
    },
    status: {
      type: String,
      enum: ['sent', 'processing', 'completed', 'error'],
      default: 'sent',
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSSTGroup',
      required: false,
      index: true,
    },
  },
  { timestamps: true }
);

const ChatSSTMessage = mongoose.model('ChatSSTMessage', chatSSTMessageSchema);

module.exports = ChatSSTMessage;
