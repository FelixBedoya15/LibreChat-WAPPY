const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const models = createModels(mongoose);

// Inject new field for scheduled inactivation
models.User.schema.add({ inactiveAt: Date });
// Inject new field for scheduled activation
models.User.schema.add({ activeAt: Date });
// Inject pushSubscriptions for PWA Web Push
models.User.schema.add({ pushSubscriptions: { type: Array, default: [] } });

// Inject whatsapp routing field for Agents
if (models.Agent && models.Agent.schema) {
  models.Agent.schema.add({ is_whatsapp_enabled: { type: Boolean, default: false } });
}

module.exports = { ...models };
