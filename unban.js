require('dotenv').config();
const { getLogStores } = require('./api/cache');
const { ViolationTypes } = require('librechat-data-provider');

async function unban() {
  const banLogs = getLogStores(ViolationTypes.BAN);
  if (banLogs) {
    await banLogs.clear();
    console.log("All bans cleared from cache!");
  }
}
unban().catch(console.error).finally(() => process.exit(0));
