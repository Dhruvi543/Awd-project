import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Doctor from './src/models/Doctor.js';
import Setting from './src/models/Setting.js';

const MONGO_URI = "mongodb://127.0.0.1:27017/doxi";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Setting.deleteMany({});

    // Create Settings
    await Setting.create({ bookingFee: 100 });
    console.log("Settings created");

    // Create Patient
    await User.create({
      name: "Patient Test",
      email: "patient@doxi.com",
      password: "password123", // It will be hashed by pre-save
      role: "patient",
      gender: "male",
      dateOfBirth: "1990-01-01"
    });
    console.log("Patient created");

    // Create Doctor
    const docUser = await User.create({
      name: "Dr. Doctor Test",
      email: "doctor@doxi.com",
      password: "password123",
      role: "doctor",
      gender: "male",
      consultationFee: 500,
      specialization: "Cardiology",
      experience: 5,
      licenseNo: "LIC12345678",
      isApproved: true
    });
    
    await Doctor.create({
      user: docUser._id,
      specialization: "Cardiology",
      experience: 5,
      consultationFee: 500,
      isApproved: true,
      availability: [
        { day: "Monday", slots: [{ startTime: "09:00", endTime: "17:00", isBooked: false }] },
        { day: "Tuesday", slots: [{ startTime: "09:00", endTime: "17:00", isBooked: false }] }
      ]
    });
    console.log("Doctor created");

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
