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
  bookingFee: {
    type: Number,
    default: 100,
    min: 0
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

