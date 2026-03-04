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

  // Force update SGSST permissions for existing users (Migration)
  try {
    const { Role } = require('~/db/models');
    await Role.updateOne({ name: 'USER' }, { $set: { 'permissions.SGSST.USE': false } });
    await Role.updateOne({ name: 'USER_GO' }, { $set: { 'permissions.SGSST.USE': false } });
    await Role.updateOne({ name: 'ADMIN' }, { $set: { 'permissions.SGSST.USE': true } });
  } catch (err) {
    console.warn('Could not force update SGSST roles on boot:', err.message);
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
