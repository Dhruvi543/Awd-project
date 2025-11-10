import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    trim: true 
  },
  phone: { type: String, trim: true },
  specialization: { type: String, trim: true },
  experience: { type: String, trim: true },
  qualification: { type: String, trim: true },
  location: { type: String, trim: true },
  licenseNo: { type: String, trim: true },
  clinicHospitalType: { 
    type: String, 
    enum: ['clinic', 'hospital'],
    trim: true 
  },
  clinicHospitalName: { type: String, trim: true },
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Doctor approval status - only for doctors
  isApproved: {
    type: Boolean,
    default: function() {
      // Default to false for doctors, true for others (patients, admin)
      return this.role !== 'doctor';
    }
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);