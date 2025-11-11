import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['patient_registered', 'doctor_registered', 'appointment_booked', 'appointment_request', 'appointment_cancelled', 'appointment_confirmed', 'appointment_rejected', 'appointment_updated', 'appointment_deleted', 'appointment_completed', 'doctor_approved', 'doctor_rejected', 'system'],
    default: 'system'
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('Notification', notificationSchema);
