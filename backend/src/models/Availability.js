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
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String,
    enum: ['user', 'admin', 'system_cascade']
  }
}, {
  timestamps: true
});
const filterDeleted = function(next) {
  if (this.options && this.options.skipSoftDeleteFilter) return next();

  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
};

availabilitySchema.pre('find', filterDeleted);
availabilitySchema.pre('findOne', filterDeleted);
availabilitySchema.pre('countDocuments', filterDeleted);
availabilitySchema.pre('count', filterDeleted);

availabilitySchema.pre('aggregate', function(next) {
  const options = this.options || {};
  if (options.skipSoftDeleteFilter) return next();

  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export default mongoose.model('Availability', availabilitySchema);
