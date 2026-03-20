import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    default: 'DOXI Healthcare Platform',
    required: true
  },
  siteDescription: {
    type: String,
    default: 'Your trusted healthcare appointment platform',
    required: true
  },
  
  // System Settings
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: false
  },
  autoApproveDoctors: {
    type: Boolean,
    default: false
  },
  
  // Payment Settings
  // Platform Fee Percentage - percentage of doctor's booking fee collected online
  // This goes entirely to the platform as revenue
  platformFeePercentage: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
  },
  platformFeeLastUpdated: {
    type: Date,
    default: Date.now
  },
  // Legacy field - kept for backward compatibility
  bookingFee: {
    type: Number,
    default: 100,
    min: 0
  },
  platformCommissionPercentage: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
  },
  commissionLastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Terms & Conditions Settings
  termsAndConditions: {
    type: String,
    default: 'Please read and accept our Terms & Conditions to use the platform.'
  },
  termsVersion: {
    type: Number,
    default: 1
  },
  termsLastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Privacy Policy Settings
  privacyPolicy: {
    type: String,
    default: 'Please read our Privacy Policy to understand how we handle your data.'
  },
  privacyPolicyVersion: {
    type: Number,
    default: 1
  },
  privacyPolicyLastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Appointment Settings
  maxAppointmentsPerDay: {
    type: Number,
    default: 10,
    min: 1,
    max: 1000
  },
  appointmentDuration: {
    type: Number,
    default: 30,
    min: 5,
    max: 480 // 8 hours max
  },
  workingHoursStart: {
    type: String,
    default: '09:00'
  },
  workingHoursEnd: {
    type: String,
    default: '17:00'
  },
  
  // Security Settings
  minPasswordLength: {
    type: Number,
    default: 6,
    min: 6,
    max: 20
  },
  sessionTimeout: {
    type: Number,
    default: 30,
    min: 5,
    max: 1440 // 24 hours max
  },
  
  // Metadata
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('Setting', settingSchema);

