const mongoose = require('mongoose');
const { createModels } = require('@librechat/data-schemas');
const models = createModels(mongoose);

// Inject new field for scheduled inactivation
models.User.schema.add({ inactiveAt: Date });

module.exports = { ...models };
