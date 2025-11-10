import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import { ENV } from './src/config/env.js';

async function createAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(ENV.MONGO_URI);
    console.log('✅ Connected to database');

    // Admin credentials (you can change these)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@doxi.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('ℹ️  Admin user already exists with email:', adminEmail);
        console.log('   You can login with these credentials:');
        console.log('   Email:', adminEmail);
        console.log('   Password:', adminPassword);
        await mongoose.disconnect();
        return;
      } else {
        console.log('⚠️  User exists but is not an admin. Updating role...');
        existingAdmin.role = 'admin';
        existingAdmin.name = adminName;
        await existingAdmin.save();
        console.log('✅ User updated to admin role');
        await mongoose.disconnect();
        return;
      }
    }

    // Create new admin user
    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Will be hashed by pre-save hook
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('\n🔗 Login URL: http://localhost:5173/admin-login');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();

