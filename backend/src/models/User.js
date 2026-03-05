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
  consultationFee: {
    type: Number,
    default: 500,
  },
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
  // Soft delete capabilities
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
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

// Indexes for optimized querying
userSchema.index({ role: 1, isApproved: 1, isDeleted: 1 });
userSchema.index({ name: 1 });
userSchema.index({ specialization: 1 });

// Soft delete global filter hook
const filterDeleted = function(next) {
  if (this.options && this.options.skipSoftDeleteFilter) return next();
  
  // Always exclude soft-deleted records unless explicitly asked for them
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
};

userSchema.pre('find', filterDeleted);
userSchema.pre('findOne', filterDeleted);
userSchema.pre('countDocuments', filterDeleted);
userSchema.pre('count', filterDeleted);

userSchema.pre('aggregate', function(next) {
  const options = this.options || {};
  if (options.skipSoftDeleteFilter) return next();
  
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export default mongoose.model('User', userSchema);