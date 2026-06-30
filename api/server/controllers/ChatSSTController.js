const mongoose = require('mongoose');
const ChatSSTMessage = require('../../models/ChatSSTMessage');
const ChatSSTGroup = require('../../models/ChatSSTGroup');
const ChatSSTGroupInvitation = require('../../models/ChatSSTGroupInvitation');
const Notification = require('../../models/Notification');
const KanbanTask = require('../../models/KanbanTask');
const wappyQueueService = require('../../services/wappyQueueService');

const getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { groupId } = req.query;

    const query = {};
    if (groupId && groupId !== 'general') {
      query.groupId = groupId;
    } else {
      query.$or = [
        { groupId: { $exists: false } },
        { groupId: null }
      ];
    }

    const messages = await ChatSSTMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email avatar role');

    res.status(200).json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    console.error('Error al obtener mensajes de Chat SST:', error);
    res.status(500).json({ success: false, message: 'Error al obtener mensajes.' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, mentions, replyTo, groupId } = req.body;
    const user = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'El contenido del mensaje es requerido.' });
    }

    const newMessage = await ChatSSTMessage.create({
      user: user?._id || user?.id,
      senderName: user?.name || user?.email?.split('@')[0] || 'Usuario',
      senderRole: user?.role === 'ADMIN' ? 'admin' : 'user',
      content: content.trim(),
      mentions: mentions || [],
      replyTo: replyTo || null,
      groupId: groupId && groupId !== 'general' ? groupId : null,
      status: 'sent',
    });

    const populatedMessage = await ChatSSTMessage.findById(newMessage._id).populate('user', 'name email avatar role');

    const io = req.app.get('socketio');
    if (io) {
      io.emit('chat_sst_message', populatedMessage);
    }

    const isWappyMentioned = content.toLowerCase().includes('@wappy') || (mentions && mentions.includes('@wappy'));
    let queuePosition = 0;
    if (isWappyMentioned) {
      queuePosition = wappyQueueService.enqueue(populatedMessage);
    }

    res.status(201).json({
      success: true,
      data: populatedMessage,
      queuePosition,
    });
  } catch (error) {
    console.error('Error al enviar mensaje en Chat SST:', error);
    res.status(500).json({ success: false, message: 'Error al enviar el mensaje.' });
  }
};

const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?._id || req.user?.id;

    const msg = await ChatSSTMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado.' });
    }

    const isOwner = msg.user && msg.user.toString() === userId?.toString();
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para editar este mensaje.' });
    }

    msg.content = content;
    await msg.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('chat_sst_message_updated', msg);
    }

    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    console.error('Error al actualizar mensaje:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar mensaje.' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    const msg = await ChatSSTMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado.' });
    }

    const isOwner = msg.user && msg.user.toString() === userId?.toString();
    const isAdmin = req.user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este mensaje.' });
    }

    await ChatSSTMessage.findByIdAndDelete(id);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('chat_sst_message_deleted', id);
    }

    res.status(200).json({ success: true, message: 'Mensaje eliminado.' });
  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar mensaje.' });
  }
};

const regenerateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const botMsg = await ChatSSTMessage.findById(id);
    if (!botMsg) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado.' });
    }

    let userMsg = null;
    if (botMsg.senderRole === 'bot' && botMsg.replyTo) {
      userMsg = await ChatSSTMessage.findById(botMsg.replyTo);
      await ChatSSTMessage.findByIdAndDelete(botMsg._id);
    } else if (botMsg.senderRole === 'user') {
      userMsg = botMsg;
    }

    if (!userMsg) {
      return res.status(400).json({ success: false, message: 'No se encontró la consulta de usuario original.' });
    }

    const populatedUserMsg = await ChatSSTMessage.findById(userMsg._id).populate('user', 'name email avatar role');
    const queuePosition = wappyQueueService.enqueue(populatedUserMsg);

    res.status(200).json({ success: true, queuePosition, message: 'Re-encolado para regeneración.' });
  } catch (error) {
    console.error('Error al regenerar mensaje:', error);
    res.status(500).json({ success: false, message: 'Error al regenerar respuesta.' });
  }
};

// --- CONTROLADORES DE GRUPOS E INVITACIONES ---

const getGroups = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await ChatSSTGroup.find({ members: userId })
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar role');
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener grupos.' });
  }
};

const createGroup = async (req, res) => {
  try {
    const { name, invitedUserIds } = req.body;
    const creatorId = req.user.id;
    const role = req.user.role;

    if (role !== 'ADMIN' && role !== 'USER_PRO') {
      return res.status(403).json({ success: false, message: 'Solo los usuarios PRO y Administradores pueden crear grupos.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del grupo es requerido.' });
    }

    const group = await ChatSSTGroup.create({
      name: name.trim(),
      createdBy: creatorId,
      members: [creatorId],
      companyId: 'default',
    });

    const io = req.app.get('socketio');

    if (Array.isArray(invitedUserIds)) {
      for (const invitedUserId of invitedUserIds) {
        if (invitedUserId !== creatorId) {
          await createInvitationAndNotification(group, invitedUserId, creatorId, io);
        }
      }
    }

    const populatedGroup = await ChatSSTGroup.findById(group._id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar role');

    res.status(201).json({ success: true, data: populatedGroup });
  } catch (error) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ success: false, message: 'Error al crear el grupo.' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const User = mongoose.model('User');
    const users = await User.find({
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
        { username: { $regex: q.trim(), $options: 'i' } },
      ],
    })
      .select('name email avatar role')
      .limit(10);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al buscar usuarios.' });
  }
};

const inviteToGroup = async (req, res) => {
  try {
    const { id } = req.params; // groupId
    const { invitedUserIds } = req.body;
    const userId = req.user.id;

    const group = await ChatSSTGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado.' });
    }

    const isCreator = group.createdBy.toString() === userId.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para invitar usuarios a este grupo.' });
    }

    const io = req.app.get('socketio');
    if (Array.isArray(invitedUserIds)) {
      for (const invitedUserId of invitedUserIds) {
        const isMember = group.members.includes(invitedUserId);
        const hasPending = await ChatSSTGroupInvitation.findOne({
          group: group._id,
          invitedUser: invitedUserId,
          status: 'pending',
        });

        if (!isMember && !hasPending) {
          await createInvitationAndNotification(group, invitedUserId, userId, io);
        }
      }
    }

    res.status(200).json({ success: true, message: 'Invitaciones enviadas.' });
  } catch (error) {
    console.error('Error al enviar invitaciones:', error);
    res.status(500).json({ success: false, message: 'Error al enviar invitaciones.' });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invitation = await ChatSSTGroupInvitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitación no encontrada o expirada.' });
    }

    if (invitation.invitedUser.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'No estás autorizado para aceptar esta invitación.' });
    }

    invitation.status = 'accepted';
    await invitation.save();

    const group = await ChatSSTGroup.findById(invitation.group);
    if (group && !group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    if (invitation.kanbanTaskId) {
      const task = await KanbanTask.findById(invitation.kanbanTaskId);
      if (task) {
        task.status = 'done';
        task.completedAt = new Date();
        await task.save();
      }
    }

    const notification = await Notification.findOne({
      user: userId,
      type: 'group_invitation',
      'metadata.invitationId': invitation._id,
    });
    if (notification) {
      notification.read = true;
      await notification.save();
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit(`kanban_update_${userId}`);
    }

    res.status(200).json({ success: true, message: 'Invitación aceptada correctamente.', groupId: group?._id });
  } catch (error) {
    console.error('Error al aceptar invitación:', error);
    res.status(500).json({ success: false, message: 'Error al aceptar la invitación.' });
  }
};

const rejectInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invitation = await ChatSSTGroupInvitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitación no encontrada.' });
    }

    if (invitation.invitedUser.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'No estás autorizado para rechazar esta invitación.' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    if (invitation.kanbanTaskId) {
      await KanbanTask.findByIdAndDelete(invitation.kanbanTaskId);
    }

    const notification = await Notification.findOne({
      user: userId,
      type: 'group_invitation',
      'metadata.invitationId': invitation._id,
    });
    if (notification) {
      notification.read = true;
      await notification.save();
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit(`kanban_update_${userId}`);
    }

    res.status(200).json({ success: true, message: 'Invitación rechazada correctamente.' });
  } catch (error) {
    console.error('Error al rechazar invitación:', error);
    res.status(500).json({ success: false, message: 'Error al rechazar la invitación.' });
  }
};

const getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const invitations = await ChatSSTGroupInvitation.find({ invitedUser: userId, status: 'pending' })
      .populate('group', 'name')
      .populate('invitedBy', 'name email avatar');
    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    console.error('Error al obtener invitaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener invitaciones.' });
  }
};

// --- FUNCIÓN DE UTILIDAD INTERNA ---

const createInvitationAndNotification = async (group, invitedUserId, invitedById, io) => {
  const invitation = await ChatSSTGroupInvitation.create({
    group: group._id,
    invitedUser: invitedUserId,
    invitedBy: invitedById,
    status: 'pending',
  });

  const User = mongoose.model('User');
  const groupCreator = await User.findById(invitedById);
  const creatorName = groupCreator?.name || 'Un usuario';

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  dueDate.setHours(23, 59, 59, 999);

  const task = await KanbanTask.create({
    user: invitedUserId,
    title: `Invitación al grupo "${group.name}"`,
    description: `Has sido invitado al grupo "${group.name}" en el Chat SST por ${creatorName}. Acepta esta tarea para unirte al grupo.`,
    status: 'todo',
    dueDate: dueDate,
    type: 'other',
    referenceId: invitation._id.toString(),
    referenceName: 'group_invitation',
    companyId: 'default',
  });

  invitation.kanbanTaskId = task._id;
  await invitation.save();

  const notification = await Notification.create({
    user: invitedUserId,
    type: 'group_invitation',
    title: 'Invitación a Grupo de Chat SST',
    body: `${creatorName} te ha invitado a unirte al grupo de chat "${group.name}".`,
    metadata: {
      invitationId: invitation._id,
      groupId: group._id,
      kanbanTaskId: task._id,
    },
  });

  if (io) {
    io.emit(`notification_${invitedUserId}`, notification);
    io.emit(`kanban_update_${invitedUserId}`);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  regenerateMessage,
  getGroups,
  createGroup,
  searchUsers,
  inviteToGroup,
  acceptInvitation,
  rejectInvitation,
  getInvitations,
};
