import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['schedule', 'leave'],
    required: true
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  reason: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  appointmentDuration: {
    type: Number,
    min: 15,
    max: 240
  },
  consultationType: {
    type: String,
    enum: ['in-person', 'online', 'both'],
    default: 'both'
  },
  maxAppointments: {
    type: Number,
    min: 1
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

export default mongoose.model('Availability', availabilitySchema);
