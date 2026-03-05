import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { deleteDoctor, restoreAccount } from '../controllers/admin.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Helper to mock express res object
const mockRes = () => {
  const res = {};
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.data = data; return this; };
  return res;
};

async function runVerification() {
  console.log('--- STARTING SOFT DELETE LIFECYCLE VERIFICATION ---');
  await mongoose.connect(MONGO_URI);
  console.log('[SUCCESS] Connected to MongoDB');

  // Step 1: Create Dummy Accounts & Relations
  console.log('\n[STEP 1] Generating Dummy Doctor, Patient, and Appointment...');
  
  const doctor = new User({
    name: 'Dr. John Doe Validation',
    email: `valid.doc.${Date.now()}@example.com`,
    password: 'password123',
    role: 'doctor',
    specialization: 'General',
    degree: 'MD',
    experience: 5,
    fees: 50,
    address: { street: '123 Test', city: 'Testville', state: 'TS', zipCode: '12345' },
    isApproved: true
  });
  await doctor.save();

  const patient = new User({
    name: 'Jane Doe Validation',
    email: `valid.pat.${Date.now()}@example.com`,
    password: 'password123',
    role: 'patient'
  });
  await patient.save();

  const appointment = new Appointment({
    doctor: doctor._id,
    patient: patient._id,
    appointmentDate: new Date(Date.now() + 86400000), // Tomorrow
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    status: 'pending'
  });
  await appointment.save();
  
  const adminId = new mongoose.Types.ObjectId(); // Mock Admin ID

  console.log(`Created Doctor: ${doctor._id}`);
  console.log(`Created Patient: ${patient._id}`);
  console.log(`Created Appointment: ${appointment._id}`);

  // Step 2: Execute Delete Controller
  console.log('\n[STEP 2] Executing deleteDoctor Controller...');
  const reqDelete = { params: { id: doctor._id }, user: { _id: adminId } };
  const resDelete = mockRes();
  
  try {
    await deleteDoctor(reqDelete, resDelete, (err) => { if(err) throw err; });
    console.log(`deleteDoctor Response Status: ${resDelete.statusCode || 200}`);
    console.log(`deleteDoctor Response Data: ${JSON.stringify(resDelete.data)}`);
  } catch (e) {
    console.error('deleteDoctor Execution Failed. Note: If this is a replica set error, you must run MongoDB as a replica set for transactions.', e);
    process.exit(1);
  }

  // Step 3: Validate skipSoftDeleteFilter and Appt Status
  console.log('\n[STEP 3] Validating Observability Context and Global Rules...');
  // Attempt standard query (should fail/hide)
  const hiddenDoctor = await User.findById(doctor._id);
  console.log(`Standard Query visibility: ${hiddenDoctor ? 'FAILED_HIDING' : 'SUCCESS_HIDDEN'}`);
  
  // Attempt admin override query
  const adminDoctor = await User.findById(doctor._id).setOptions({ skipSoftDeleteFilter: true });
  console.log(`Admin skipSoftDeleteFilter visibility: ${adminDoctor && adminDoctor.isDeleted ? 'SUCCESS_FOUND_DELETED' : 'FAILED'}`);

  const cancelledAppt = await Appointment.findById(appointment._id).setOptions({ skipSoftDeleteFilter: true });
  console.log(`Appointment Status: ${cancelledAppt.status}`);
  console.log(`Appointment Cancellation Source: ${cancelledAppt.cancellationSource}`);

  // Step 4: Execute Restore Controller
  console.log('\n[STEP 4] Executing restoreAccount Controller...');
  const reqRestore = { params: { id: doctor._id }, user: { _id: adminId } };
  const resRestore = mockRes();

  await restoreAccount(reqRestore, resRestore, (err) => { if (err) throw err; });
  console.log(`restoreAccount Response Status: ${resRestore.statusCode || 200}`);
  console.log(`restoreAccount Response Data: ${JSON.stringify(resRestore.data)}`);

  // Verify Restoration Status
  const restoredDoctor = await User.findById(doctor._id);
  console.log(`Doctor Post-Restore Standard Visibility: ${restoredDoctor && !restoredDoctor.isDeleted ? 'SUCCESS' : 'FAILED'}`);

  const restoredAppt = await Appointment.findById(appointment._id);
  console.log(`Appointment Post-Restore Status: ${restoredAppt.status} (Should be pending)`);

  // Final Cleanup
  console.log('\n[CLEANUP] Removing mock validation entities...');
  await User.deleteOne({ _id: doctor._id });
  await User.deleteOne({ _id: patient._id });
  await Appointment.deleteOne({ _id: appointment._id });

  console.log('\n--- LIFECYCLE VERIFICATION COMPLETE ---');
  process.exit(0);
}

runVerification();
