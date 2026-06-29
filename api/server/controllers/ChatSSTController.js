const ChatSSTMessage = require('../../models/ChatSSTMessage');
const wappyQueueService = require('../../services/wappyQueueService');

const getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const messages = await ChatSSTMessage.find()
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
    const { content, mentions, replyTo } = req.body;
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

module.exports = {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  regenerateMessage,
};
