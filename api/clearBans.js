require('dotenv').config();
const { connect } = require('./db/connect');
const mongoose = require('mongoose');

async function run() {
  await connect();
  const db = mongoose.connection.db;
  await db.collection('keyv').deleteMany({ key: { $regex: 'ban_cache|BAN' } });
  console.log('Bans cleared!');
  process.exit();
}
run();
