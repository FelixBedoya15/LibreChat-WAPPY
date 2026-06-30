const mongoose = require('mongoose');

const chatSSTGroupInvitationSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSSTGroup',
      required: true,
      index: true,
    },
    invitedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    kanbanTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanTask',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChatSSTGroupInvitation = mongoose.models.ChatSSTGroupInvitation || mongoose.model('ChatSSTGroupInvitation', chatSSTGroupInvitationSchema);

module.exports = ChatSSTGroupInvitation;
