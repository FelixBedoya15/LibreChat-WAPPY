const { MongoClient } = require('mongodb');
(async () => {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db = client.db('LibreChat');
  const msgs = await db.collection('messages').find({conversationId: "fee94146-6dfa-4c7e-af26-e8ccb343cdd0"}).sort({createdAt: 1}).toArray();
  msgs.forEach(m => console.log(m.role + " | " + JSON.stringify(m.content)));
  await client.close();
})();
