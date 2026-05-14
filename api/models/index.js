const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const methods = createMethods(mongoose);
const { comparePassword } = require('./userMethods');
const {
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,
} = require('./File');
const {
  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
} = require('./Message');
const { getConvoTitle, getConvo, saveConvo, deleteConvos } = require('./Conversation');
const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');
const { File } = require('~/db/models');

const seedDatabase = async () => {
  await methods.initializeRoles();
  await methods.seedDefaultRoles();
  await methods.ensureDefaultCategories();

  // Seed all custom roles so they appear in the DB (e.g. agent People Picker search)
  try {
    const { Role } = require('~/db/models');
    const { roleDefaults, SystemRoles } = require('librechat-data-provider');
    const customRoles = [
      SystemRoles.USER_GO,
      SystemRoles.USER_PLUS,
      SystemRoles.USER_PRO,
      SystemRoles.USER_CUSTOM,
      SystemRoles.USER_IPEVAR,
    ];
    for (const roleName of customRoles) {
      const exists = await Role.findOne({ name: roleName });
      if (!exists) {
        await new Role(roleDefaults[roleName]).save();
        console.log(`Seeded missing role: ${roleName}`);
      }
    }
  } catch (err) {
    console.warn('Could not seed custom roles on boot:', err.message);
  }

  // Force update SGSST permissions for existing users (Migration)
  try {
    const { Role } = require('~/db/models');
    await Role.updateOne({ name: 'USER' }, { $set: { 'permissions.SGSST.USE': false } });
    await Role.updateOne({ name: 'USER_GO' }, { $set: { 'permissions.SGSST.USE': false } });
    await Role.updateOne({ name: 'ADMIN' }, { $set: { 'permissions.SGSST.USE': true } });
  } catch (err) {
    console.warn('Could not force update SGSST roles on boot:', err.message);
  }

  // Force USER_IPEVAR to always have AGENTS.USE = true
  // (The admin panel may have turned this off inadvertently)
  try {
    const { Role } = require('~/db/models');
    await Role.updateOne(
      { name: 'USER_IPEVAR' },
      { $set: { 'permissions.AGENTS.USE': true, 'permissions.AGENTS.CREATE': false } }
    );
    console.log('Corrected USER_IPEVAR AGENTS permissions');
  } catch (err) {
    console.warn('Could not force update USER_IPEVAR AGENTS permission:', err.message);
  }
};

module.exports = {
  ...methods,
  seedDatabase,
  comparePassword,
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,

  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,

  getConvoTitle,
  getConvo,
  saveConvo,
  deleteConvos,

  getPreset,
  getPresets,
  savePreset,
  deletePresets,

  Files: File,
};
