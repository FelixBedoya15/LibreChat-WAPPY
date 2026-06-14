const mongoose = require('mongoose');
const ComunidadConfig = require('./api/models/ComunidadConfig');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/LibreChat');
  const configs = await ComunidadConfig.find({});
  console.log("All configurations in ComunidadConfig:");
  configs.forEach(c => {
    console.log({
      funnelKey: c.funnelKey,
      requiresPayment: c.requiresPayment,
      price: c.price,
      gatingEnabled: c.gatingEnabled,
      gatingSeconds: c.gatingSeconds,
      downloadableFiles: c.downloadableFiles ? c.downloadableFiles.length : 0
    });
  });
  process.exit(0);
}
run();
