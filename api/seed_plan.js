require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function seedPlan() {
  try {
    console.log('Conectando a MongoDB...', "mongodb://127.0.0.1:27017/LibreChat");
    await mongoose.connect("mongodb://127.0.0.1:27017/LibreChat");
    console.log('Conectado a la base de datos.');

    const Plan = require('./models/Plan');

    const ipevarPlan = {
      planId: 'ipevar',
      name: 'IPEVAR',
      prices: {
        monthly: 0,
        quarterly: 0,
        semiannual: 0,
        annual: 250000
      },
      featuresText: [
        'Acceso total a la Matriz IPEVAR',
        'Valoraciones automáticas con IA',
        'Generación de reportes PDF',
        'Licencia por 1 año'
      ]
    };

    const result = await Plan.findOneAndUpdate(
      { planId: 'ipevar' },
      { $set: ipevarPlan },
      { upsert: true, new: true }
    );

    console.log('Plan IPEVAR configurado correctamente en DB:', result);

  } catch (error) {
    console.error('Error al inicializar plan:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
  }
}

seedPlan();
