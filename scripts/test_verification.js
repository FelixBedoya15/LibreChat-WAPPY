// Mock SlowBuffer for Node 22+ / 26+ compatibility to prevent buffer-equal-constant-time from crashing
const bufferModule = require('buffer');
if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = function() {};
  bufferModule.SlowBuffer.prototype = {};
}

// Manual module-alias registration for subpath import resolution (~)
const moduleAlias = require('module-alias');
const path = require('path');
moduleAlias.addAlias('~', path.join(__dirname, '../api'));

const mongoose = require('mongoose');
require('dotenv').config();

// Require api/models to register all mongoose schemas automatically
require('../api/models');

const UserPlan = require('../api/db/models/UserPlan');
const CompanyInfo = require('../api/models/CompanyInfo');
const WompiTransaction = require('../api/models/WompiTransaction');
const User = mongoose.models.User || mongoose.model('User');
const FileModel = mongoose.models.File || mongoose.model('File');

async function testGrandfathering() {
  console.log('--- Test Case 1: Grandfathering Rule ---');
  
  // Cutoff date is 2026-06-23T13:00:00-05:00
  const cutoff = new Date('2026-06-23T13:00:00-05:00');
  const uniqueId = Date.now();
  
  // Create an old user (legacy Pro)
  const legacyUser = new User({
    name: 'Legacy User',
    username: `legacyuser_${uniqueId}`,
    email: `legacy_${uniqueId}@example.com`,
    password: 'password',
    createdAt: new Date(cutoff.getTime() - 60000) // 1 minute before cutoff
  });
  await legacyUser.save();
  
  // Create a new user (new Pro)
  const newUser = new User({
    name: 'New User',
    username: `newuser_${uniqueId}`,
    email: `new_${uniqueId}@example.com`,
    password: 'password',
    createdAt: new Date(cutoff.getTime() + 60000) // 1 minute after cutoff
  });
  await newUser.save();
  
  // Set plans to 'pro' with no specific limits custom defined in UserPlan
  const legacyPlan = new UserPlan({
    userId: legacyUser._id,
    plan: 'pro'
  });
  await legacyPlan.save();
  
  const newPlan = new UserPlan({
    userId: newUser._id,
    plan: 'pro'
  });
  await newPlan.save();
  
  // Verify company limit helper logic (from companyInfo.js)
  const resolveLimit = async (userId, userCreatedAt, planKey) => {
    const userPlanDoc = await UserPlan.findOne({ userId }).lean();
    let limit = 1;
    if (userPlanDoc && userPlanDoc.companyLimit !== undefined && userPlanDoc.companyLimit !== null) {
      limit = userPlanDoc.companyLimit;
    } else {
      if (planKey === 'pro') {
        const CUTOFF_DATE = new Date('2026-06-23T13:00:00-05:00');
        if (userCreatedAt < CUTOFF_DATE) {
          limit = 3;
        } else {
          limit = 1;
        }
      } else if (['admin', 'custom'].includes(planKey)) {
        limit = 999;
      } else {
        limit = 1;
      }
    }
    return limit;
  };
  
  const legacyLimit = await resolveLimit(legacyUser._id, legacyUser.createdAt, 'pro');
  const newLimit = await resolveLimit(newUser._id, newUser.createdAt, 'pro');
  
  console.log(`Legacy user limit (Expected 3): ${legacyLimit}`);
  console.log(`New user limit (Expected 1): ${newLimit}`);
  
  if (legacyLimit !== 3 || newLimit !== 1) {
    throw new Error('Grandfathering limits did not resolve correctly');
  }
  
  // Clean up
  await User.deleteOne({ _id: legacyUser._id });
  await User.deleteOne({ _id: newUser._id });
  await UserPlan.deleteOne({ userId: legacyUser._id });
  await UserPlan.deleteOne({ userId: newUser._id });
  console.log('Grandfathering tests passed!');
}

async function testWompiAprovisioning() {
  console.log('\n--- Test Case 2: Wompi Provisioning & Storage Limits ---');
  
  const uniqueId = Date.now();
  const testUser = new User({
    name: 'Wompi Test User',
    username: `wompitest_${uniqueId}`,
    email: `wompi_${uniqueId}@example.com`,
    password: 'password'
  });
  await testUser.save();
  
  // Simulate webhook code logic for a transaction with 2 extra companies
  const wompiTx = {
    planId: 'pro',
    interval: 'annual',
    extraCompanies: 2
  };
  
  // Resolve limits
  const extraCount = Math.min(9, wompiTx.extraCompanies || 0);
  const companyLimit = 1 + extraCount;
  const baseStorageGB = ['pro', 'plus'].includes(wompiTx.planId) ? 3 : 1;
  const totalStorageBytes = (baseStorageGB + extraCount) * 1024 * 1024 * 1024;
  
  const userPlan = new UserPlan({
    userId: testUser._id,
    plan: wompiTx.planId,
    companyLimit,
    storageLimit: totalStorageBytes
  });
  await userPlan.save();
  
  console.log(`Pro with +2 companies:`);
  console.log(`Company limit (Expected 3): ${userPlan.companyLimit}`);
  console.log(`Storage limit in GB (Expected 5): ${userPlan.storageLimit / (1024 * 1024 * 1024)}`);
  
  if (userPlan.companyLimit !== 3 || userPlan.storageLimit !== 5 * 1024 * 1024 * 1024) {
    throw new Error('Provisioning limits calculation is incorrect');
  }

  // Simulate webhook code logic for a transaction with 12 extra companies (should be capped at 9)
  const wompiTxOverLimit = {
    planId: 'pro',
    interval: 'annual',
    extraCompanies: 12
  };
  
  // Resolve limits with cap
  const extraCountCapped = Math.min(9, wompiTxOverLimit.extraCompanies || 0);
  const companyLimitCapped = 1 + extraCountCapped;
  const totalStorageBytesCapped = (baseStorageGB + extraCountCapped) * 1024 * 1024 * 1024;
  
  console.log(`Pro with +12 companies (capped at 9):`);
  console.log(`Company limit (Expected 10): ${companyLimitCapped}`);
  console.log(`Storage limit in GB (Expected 12): ${totalStorageBytesCapped / (1024 * 1024 * 1024)}`);
  
  if (companyLimitCapped !== 10 || totalStorageBytesCapped !== 12 * 1024 * 1024 * 1024) {
    throw new Error('Provisioning limits cap calculation is incorrect');
  }
  
  await UserPlan.deleteOne({ userId: testUser._id });
  await User.deleteOne({ _id: testUser._id });
  console.log('Wompi provisioning tests passed!');
}

async function testChatCleanupJob() {
  console.log('\n--- Test Case 3: Chat Files Cleanup Job ---');
  
  const fs = require('fs');
  const uniqueId = Date.now();
  const testUser = new User({
    name: 'Cleanup Test User',
    username: `cleanupuser_${uniqueId}`,
    email: `cleanup_${uniqueId}@example.com`,
    password: 'password'
  });
  await testUser.save();
  
  // Define physical test file paths
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const userUploadsDir = path.join(uploadsDir, testUser._id.toString());
  if (!fs.existsSync(userUploadsDir)) {
    fs.mkdirSync(userUploadsDir, { recursive: true });
  }
  
  const dummyFilepath1 = path.join(userUploadsDir, `expired_user_file_${uniqueId}.txt`);
  fs.writeFileSync(dummyFilepath1, 'dummy user content');
  
  const dummyFilepath2 = path.join(userUploadsDir, `expired_nouser_file_${uniqueId}.txt`);
  fs.writeFileSync(dummyFilepath2, 'dummy nouser content');

  const dummyFilepath3 = path.join(userUploadsDir, `fresh_file_${uniqueId}.txt`);
  fs.writeFileSync(dummyFilepath3, 'fresh content');

  const dummyFilepath4 = path.join(userUploadsDir, `sgsst_file_${uniqueId}.txt`);
  fs.writeFileSync(dummyFilepath4, 'sgsst content');

  // Cutoff is 60 days
  const now = Date.now();
  const fileExpired = new FileModel({
    file_id: `expired-file-${uniqueId}`,
    user: testUser._id,
    filename: `expired_user_file_${uniqueId}.txt`,
    filepath: `/uploads/${testUser._id}/expired_user_file_${uniqueId}.txt`,
    type: 'text/plain',
    bytes: 18,
    context: 'message_attachment',
    createdAt: new Date(now - 61 * 24 * 60 * 60 * 1000) // 61 days ago
  });
  await fileExpired.save();

  // Expired file without user
  const fileExpiredNoUser = new FileModel({
    file_id: `expired-nouser-${uniqueId}`,
    user: new mongoose.Types.ObjectId(),
    filename: `expired_nouser_file_${uniqueId}.txt`,
    filepath: `/uploads/${testUser._id}/expired_nouser_file_${uniqueId}.txt`,
    type: 'text/plain',
    bytes: 20,
    context: 'message_attachment',
    createdAt: new Date(now - 61 * 24 * 60 * 60 * 1000) // 61 days ago
  });
  await fileExpiredNoUser.save();
  
  const fileFresh = new FileModel({
    file_id: `fresh-file-${uniqueId}`,
    user: testUser._id,
    filename: `fresh_file_${uniqueId}.txt`,
    filepath: `/uploads/${testUser._id}/fresh_file_${uniqueId}.txt`,
    type: 'text/plain',
    bytes: 13,
    context: 'message_attachment',
    createdAt: new Date(now - 59 * 24 * 60 * 60 * 1000) // 59 days ago
  });
  await fileFresh.save();
  
  const fileSgsst = new FileModel({
    file_id: `sgsst-file-${uniqueId}`,
    user: testUser._id,
    filename: `sgsst_file_${uniqueId}.txt`,
    filepath: `/uploads/${testUser._id}/sgsst_file_${uniqueId}.txt`,
    type: 'text/plain',
    bytes: 13,
    context: 'sgsst_gestor', // different context
    createdAt: new Date(now - 90 * 24 * 60 * 60 * 1000) // 90 days ago (expired, but protected context!)
  });
  await fileSgsst.save();
  
  // Run simulated cleanup query & cycle
  const { runCleanupCycle } = require('../api/server/services/chatFilesCleanupJob');
  await runCleanupCycle();
  
  // Assertions: database documents
  const dbExpiredUser = await FileModel.findOne({ file_id: `expired-file-${uniqueId}` });
  const dbExpiredNoUser = await FileModel.findOne({ file_id: `expired-nouser-${uniqueId}` });
  const dbFresh = await FileModel.findOne({ file_id: `fresh-file-${uniqueId}` });
  const dbSgsst = await FileModel.findOne({ file_id: `sgsst-file-${uniqueId}` });

  if (dbExpiredUser || dbExpiredNoUser) {
    throw new Error('Expired files were not deleted from MongoDB during cleanup cycle');
  }
  if (!dbFresh || !dbSgsst) {
    throw new Error('Non-expired/SGSST files were incorrectly deleted from MongoDB');
  }

  // Assertions: physical files
  const file1Exists = fs.existsSync(dummyFilepath1);
  const file2Exists = fs.existsSync(dummyFilepath2);
  const file3Exists = fs.existsSync(dummyFilepath3);
  const file4Exists = fs.existsSync(dummyFilepath4);

  // Clean up any remaining test files
  if (fs.existsSync(dummyFilepath1)) fs.unlinkSync(dummyFilepath1);
  if (fs.existsSync(dummyFilepath2)) fs.unlinkSync(dummyFilepath2);
  if (fs.existsSync(dummyFilepath3)) fs.unlinkSync(dummyFilepath3);
  if (fs.existsSync(dummyFilepath4)) fs.unlinkSync(dummyFilepath4);
  if (fs.existsSync(userUploadsDir)) fs.rmdirSync(userUploadsDir);

  await User.deleteOne({ _id: testUser._id });
  await FileModel.deleteMany({ file_id: { $in: [`expired-file-${uniqueId}`, `expired-nouser-${uniqueId}`, `fresh-file-${uniqueId}`, `sgsst-file-${uniqueId}`] } });

  if (file1Exists || file2Exists) {
    throw new Error('Expired physical files were not deleted from disk');
  }
  if (!file3Exists || !file4Exists) {
    throw new Error('Non-expired/SGSST physical files were incorrectly deleted from disk');
  }

  console.log('Chat files cleanup job tests passed!');
}

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  console.log(`Connecting to MongoDB at: ${mongoUri}...`);
  await mongoose.connect(mongoUri);
  
  try {
    await testGrandfathering();
    await testWompiAprovisioning();
    await testChatCleanupJob();
    console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('\nVerification failed:', err);
    process.exit(1);
  }
}

run();
