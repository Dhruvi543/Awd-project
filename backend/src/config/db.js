import mongoose from 'mongoose';
import { ENV } from './env.js';

async function connectDB() {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

export { connectDB };