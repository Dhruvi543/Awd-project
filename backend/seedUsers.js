import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import { ENV } from './src/config/env.js';

// Test users data
const testUsers = [
  // Admin Users
  {
    name: 'Admin User',
    email: 'admin@doxi.com',
    password: 'admin123',
    role: 'admin'
  },
  
  // Doctor Users
  {
    name: 'Dr. John Smith',
    email: 'doctor1@doxi.com',
    password: 'doctor123',
    role: 'doctor',
    firstName: 'John',
    lastName: 'Smith',
    specialization: 'Cardiologist',
    qualification: 'MD, MBBS',
    experience: '10 years',
    location: 'New York',
    licenseNo: 'DOC12345',
    clinicHospitalType: 'hospital',
    clinicHospitalName: 'City General Hospital',
    phone: '+1-555-0101',
    gender: 'male'
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'doctor2@doxi.com',
    password: 'doctor123',
    role: 'doctor',
    firstName: 'Sarah',
    lastName: 'Johnson',
    specialization: 'Pediatrician',
    qualification: 'MD, MBBS',
    experience: '8 years',
    location: 'Los Angeles',
    licenseNo: 'DOC12346',
    clinicHospitalType: 'clinic',
    clinicHospitalName: 'Kids Care Clinic',
    phone: '+1-555-0102',
    gender: 'female'
  },
  {
    name: 'Dr. Michael Brown',
    email: 'doctor3@doxi.com',
    password: 'doctor123',
    role: 'doctor',
    firstName: 'Michael',
    lastName: 'Brown',
    specialization: 'Dermatologist',
    qualification: 'MD, MBBS',
    experience: '12 years',
    location: 'Chicago',
    licenseNo: 'DOC12347',
    clinicHospitalType: 'clinic',
    clinicHospitalName: 'Skin Care Clinic',
    phone: '+1-555-0103',
    gender: 'male'
  },
  
  // Patient Users
  {
    name: 'Patient One',
    email: 'patient1@doxi.com',
    password: 'patient123',
    role: 'patient',
    phone: '+1-555-0201',
    gender: 'male'
  },
  {
    name: 'Patient Two',
    email: 'patient2@doxi.com',
    password: 'patient123',
    role: 'patient',
    phone: '+1-555-0202',
    gender: 'female'
  },
  {
    name: 'Patient Three',
    email: 'patient3@doxi.com',
    password: 'patient123',
    role: 'patient',
    phone: '+1-555-0203',
    gender: 'male'
  }
];

async function seedUsers() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(ENV.MONGO_URI);
    console.log('✅ Connected to database');

    console.log('\n📋 Creating test users...\n');

    const createdUsers = [];
    const skippedUsers = [];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⏭️  User already exists: ${userData.email} (${userData.role})`);
          skippedUsers.push({
            ...userData,
            password: userData.password // Show password for existing users too
          });
          continue;
        }

        // Create new user
        const user = new User(userData);
        await user.save();
        
        console.log(`✅ Created ${userData.role}: ${userData.email}`);
        createdUsers.push({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role
        });
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${createdUsers.length} users`);
    console.log(`⏭️  Skipped: ${skippedUsers.length} users (already exist)`);
    console.log(`📝 Total: ${testUsers.length} users\n`);

    console.log('='.repeat(60));
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('='.repeat(60));
    
    // Group by role
    const allUsers = [...createdUsers, ...skippedUsers];
    const admins = allUsers.filter(u => u.role === 'admin');
    const doctors = allUsers.filter(u => u.role === 'doctor');
    const patients = allUsers.filter(u => u.role === 'patient');

    if (admins.length > 0) {
      console.log('\n👤 ADMIN USERS:');
      admins.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Password: ${user.password}`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Login URL: http://localhost:5173/admin-login\n`);
      });
    }

    if (doctors.length > 0) {
      console.log('\n👨‍⚕️ DOCTOR USERS:');
      doctors.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Password: ${user.password}`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Login URL: http://localhost:5173/login\n`);
      });
    }

    if (patients.length > 0) {
      console.log('\n👤 PATIENT USERS:');
      patients.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Password: ${user.password}`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Login URL: http://localhost:5173/login\n`);
      });
    }

    console.log('='.repeat(60));
    console.log('✅ Seed completed successfully!');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seed function
seedUsers();

