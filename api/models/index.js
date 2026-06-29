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

// Register custom referral & affiliate partner models
require('./Partner');
require('./PartnerCommission');
require('./ReferralRecord');
require('./PointTransaction');
require('./PayoutRequest');

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

  // Force update AGENTS.SHARED_GLOBAL and PROMPTS.SHARED_GLOBAL for ADMIN (Migration)
  try {
    const { Role } = require('~/db/models');
    await Role.updateOne(
      { name: 'ADMIN' },
      {
        $set: {
          'permissions.AGENTS.SHARED_GLOBAL': true,
          'permissions.PROMPTS.SHARED_GLOBAL': true,
        },
      },
    );
  } catch (err) {
    console.warn('Could not force update ADMIN agent/prompt sharing permissions on boot:', err.message);
  }

  // Fix USER_IPEVAR permissions if they got corrupted (surgical - only AGENTS.USE)
  try {
    const { Role } = require('~/db/models');
    const { roleDefaults, SystemRoles, CacheKeys } = require('librechat-data-provider');
    const getLogStores = require('~/cache/getLogStores');
    const cache = getLogStores(CacheKeys.ROLES);

    const ipevar = await Role.findOne({ name: 'USER_IPEVAR' }).lean();
    const permKeys = ipevar ? Object.keys(ipevar.permissions || {}) : [];

    if (!ipevar || permKeys.length <= 2) {
      // Permissions were wiped — restore from defaults, then force AGENTS.USE = true
      const defaultPerms = roleDefaults[SystemRoles.USER_IPEVAR]?.permissions || {};
      const restored = { ...defaultPerms, AGENTS: { ...(defaultPerms.AGENTS || {}), USE: true, CREATE: false } };
      await Role.findOneAndUpdate(
        { name: 'USER_IPEVAR' },
        { $set: { permissions: restored } },
        { upsert: true }
      );
      console.log('Restored USER_IPEVAR permissions from defaults');
    } else {
      // Permissions look OK — only fix AGENTS.USE surgically
      await Role.findOneAndUpdate(
        { name: 'USER_IPEVAR' },
        { $set: { 'permissions.AGENTS.USE': true, 'permissions.AGENTS.CREATE': false } }
      );
      console.log('Patched USER_IPEVAR AGENTS.USE = true');
    }
    // Clear role cache so clients see updated value immediately
    await cache.delete('USER_IPEVAR');
  } catch (err) {
    console.warn('Could not fix USER_IPEVAR AGENTS permission:', err.message);
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
  ChatSSTMessage: require('./ChatSSTMessage'),
};

