require('module-alias/register');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const { initializeWhatsAppBridge } = require('./WhatsAppBridge');

async function start() {
  console.log('[WhatsApp Boot] Iniciando proceso independiente de WhatsApp Web...');

  try {
    console.log('[WhatsApp Boot] Conectando a Mongoose...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[WhatsApp Boot] Mongoose conectado exitosamente.');

    await initializeWhatsAppBridge();
  } catch (err) {
    console.error('[WhatsApp Boot] Error de inicio:', err);
    process.exit(1);
  }
}

start();
