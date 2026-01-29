const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const models = createModels(mongoose);

// Inject new field for scheduled inactivation
models.User.schema.add({ inactiveAt: Date });
// Inject new field for scheduled activation
models.User.schema.add({ activeAt: Date });

module.exports = { ...models };
