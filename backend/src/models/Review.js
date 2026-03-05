import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false // Made optional since we auto-link to most recent appointment
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
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

reviewSchema.pre('find', filterDeleted);
reviewSchema.pre('findOne', filterDeleted);
reviewSchema.pre('countDocuments', filterDeleted);
reviewSchema.pre('count', filterDeleted);

reviewSchema.pre('aggregate', function(next) {
  const options = this.options || {};
  if (options.skipSoftDeleteFilter) return next();
  
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

export default mongoose.model('Review', reviewSchema);