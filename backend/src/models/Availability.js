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
  }
}, {
  timestamps: true
});

export default mongoose.model('Availability', availabilitySchema);
