import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import { ENV } from './src/config/env.js';

async function deleteAllUsers() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(ENV.MONGO_URI);
    console.log('✅ Connected to database');

    // Get counts before deletion
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    
    console.log(`📊 Found ${totalUsers} user(s) in database:`);
    console.log(`   - Admin: ${adminCount}`);
    console.log(`   - Patients: ${patientCount}`);
    console.log(`   - Doctors: ${doctorCount}`);

    // Delete only patients and doctors (preserve admin users)
    const result = await User.deleteMany({ 
      role: { $in: ['patient', 'doctor'] } 
    });
    
    console.log(`✅ Successfully deleted ${result.deletedCount} user(s) (patients and doctors)`);

    // Verify deletion
    const countAfter = await User.countDocuments();
    const adminAfter = await User.countDocuments({ role: 'admin' });
    console.log(`📊 Remaining users: ${countAfter} (${adminAfter} admin user(s) preserved)`);

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    console.log('✨ Patient and doctor data deleted successfully!');
    console.log('🔒 Admin user(s) preserved for continued access.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

deleteAllUsers();

