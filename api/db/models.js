const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const models = createModels(mongoose);

// Inject new field for scheduled inactivation
models.User.schema.add({ inactiveAt: Date });
// Inject new field for scheduled activation
models.User.schema.add({ activeAt: Date });
// Inject pushSubscriptions for PWA Web Push
models.User.schema.add({ pushSubscriptions: { type: Array, default: [] } });
// Inject contact and location fields
models.User.schema.add({
  phoneNumber: { type: String, trim: true },
  departamento: { type: String, trim: true },
  ciudad: { type: String, trim: true },
  department: { type: String, trim: true },
  city: { type: String, trim: true },
});

// Inject whatsapp routing field for Agents
if (models.Agent && models.Agent.schema) {
  models.Agent.schema.add({ is_whatsapp_enabled: { type: Boolean, default: false } });
  models.Agent.schema.add({ skills: { type: [String], default: [] } });
}

module.exports = { ...models };
