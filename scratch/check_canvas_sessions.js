const mongoose = require('mongoose');
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const CanvasSession = mongoose.model('CanvasSession', new mongoose.Schema({}, { strict: false }));
  const sessions = await CanvasSession.find({}).lean();
  console.log(`Found ${sessions.length} canvas sessions.`);
  for (const s of sessions) {
    console.log({
      _id: s._id,
      conversationId: s.conversationId,
      title: s.title,
      fileType: s.fileType,
      contentLength: s.content ? JSON.stringify(s.content).length : 0,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
  }

  await mongoose.disconnect();
}

main().catch(console.error);
