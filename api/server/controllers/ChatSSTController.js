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
      senderName: user?.name || user?.email?.split('@')[0] || 'Admin',
      senderRole: user?.role === 'ADMIN' ? 'admin' : 'user',
      content: content.trim(),
      mentions: mentions || [],
      replyTo: replyTo || null,
      status: 'sent',
    });

    const populatedMessage = await ChatSSTMessage.findById(newMessage._id).populate('user', 'name email avatar role');

    // Transmitir por WebSockets si el socket app está adjunto
    const io = req.app.get('socketio');
    if (io) {
      io.emit('chat_sst_message', populatedMessage);
    }

    // Si menciona a @wappy, encolar para respuesta automatizada
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

module.exports = {
  getMessages,
  sendMessage,
};
