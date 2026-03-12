import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
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
  appointmentDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  consultationNotes: {
    type: String
  },
  prescription: {
    type: String
  },
  rejectionReason: {
    type: String
  },
  cancellationSource: {
    type: String,
    enum: ['system_cascade', 'patient', 'doctor', 'admin']
  },
  previousStatus: {
    type: String,
    enum: ['pending', 'confirmed']
  },
  // Payment Fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  
  // NEW PAYMENT MODEL - Correct Business Logic
  // Doctor sets bookingFee (total fee)
  // Patient pays platformFeePercentage% of bookingFee online (goes to platform)
  // Patient pays remaining at clinic (goes to doctor)
  
  // Total fee set by doctor (copied at booking time)
  totalFee: {
    type: Number,
    default: 0
  },
  // Amount patient pays online = totalFee × platformFeePercentage / 100
  // This entire amount goes to platform as revenue
  onlineAmount: {
    type: Number,
    default: 0
  },
  // Amount patient pays at clinic = totalFee - onlineAmount
  // This goes to the doctor
  clinicAmount: {
    type: Number,
    default: 0
  },
  // Snapshot of platform fee percentage at booking time
  platformFeePercentage: {
    type: Number,
    default: 20
  },
  // When the online payment was made
  onlinePaymentAt: {
    type: Date
  },
  
  // Legacy fields - kept for backward compatibility
  totalAmount: {
    type: Number,
    default: 0
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  amountPending: {
    type: Number,
    default: 0
  },
  
  // Refund fields
  refundId: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  
  // Legacy commission fields - kept for backward compatibility
  commissionPercentage: {
    type: Number,
    default: 20
  },
  platformCommissionAmount: {
    type: Number,
    default: 0
  },
  doctorShareAmount: {
    type: Number,
    default: 0
  },
  bookingFeePaidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for optimizing appointment lookups and availability checks
appointmentSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: 1, status: 1 });

export default mongoose.model('Appointment', appointmentSchema);