const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat', { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const result = await db.collection('perfilsociodemograficodatas').deleteMany({});
  console.log('Deleted documents:', result.deletedCount);
  process.exit(0);
}

run().catch(console.error);
