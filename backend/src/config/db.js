import mongoose from 'mongoose';
import { ENV } from './env.js';

async function ensureAdmin() {
  // Dynamically import to avoid circular dependency issues at startup
  const { default: User } = await import('../models/User.js');

  const existing = await User.findOne({ email: ENV.ADMIN_EMAIL }).setOptions({ skipSoftDeleteFilter: true });
  if (existing) return; // Already exists, nothing to do

  await User.create({
    name: ENV.ADMIN_NAME,
    email: ENV.ADMIN_EMAIL,
    password: ENV.ADMIN_PASSWORD, // hashed by User pre-save hook
    role: 'admin',
    isApproved: true,
    profileComplete: true,
  });

  console.log(`✅ Admin account created: ${ENV.ADMIN_EMAIL}`);
}

async function connectDB() {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    await ensureAdmin();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export { connectDB };