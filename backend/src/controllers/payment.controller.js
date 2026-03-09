import Razorpay from 'razorpay';
import crypto from 'crypto';
import Setting from '../models/Setting.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyIdHere',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourSecretKeyHere',
});

// Create Order for Booking Fee
// NEW BUSINESS MODEL:
// - Doctor sets bookingFee (total fee)
// - Patient pays platformFeePercentage% of bookingFee online
// - Platform keeps entire online payment as revenue
// - Doctor collects remaining at clinic
export const createOrder = asyncHandler(async (req, res) => {
  // Check if user is authenticated
  if (!req.user || req.user.role !== 'patient') {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Only patients can book appointments.'
    });
  }

  try {
    const { doctorId } = req.body;
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    // 1. Fetch the doctor's booking fee
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // 2. Fetch the platform fee percentage from settings
    const settings = await Setting.getSettings();
    const platformFeePercentage = settings.platformFeePercentage || 20;
    
    // 3. Calculate amounts
    // Doctor's total fee (use bookingFee, fallback to consultationFee for backward compatibility)
    const bookingFee = doctor.bookingFee || doctor.consultationFee || 500;
    
    // Online amount = bookingFee × platformFeePercentage / 100
    // This is what patient pays online and goes entirely to platform
    const onlineAmount = Math.round((bookingFee * platformFeePercentage) / 100);
    
    // Clinic amount = bookingFee - onlineAmount
    // This is what patient pays at clinic, goes to doctor
    const clinicAmount = bookingFee - onlineAmount;

    // 4. Create options for Razorpay order
    // Amount must be in the smallest currency unit (e.g., paise for INR)
    const options = {
      amount: onlineAmount * 100, // online amount in paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    // 5. Request Razorpay to create the order
    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create Razorpay order'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyIdHere',
        // Return breakdown for frontend display
        breakdown: {
          bookingFee: bookingFee,
          platformFeePercentage: platformFeePercentage,
          onlineAmount: onlineAmount,
          clinicAmount: clinicAmount
        }
      }
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message
    });
  }
});

// Verify Payment signature
export const verifyPaymentSignature = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'YourSecretKeyHere';
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');
    
  return generatedSignature === razorpay_signature;
};

/**
 * Calculate refund amount based on cancellation policy.
 * @param {Object} appointment - The appointment document
 * @param {String} cancelledBy - 'doctor' or 'patient'
 * @returns {{ refundPercent: number, refundAmount: number, reason: string }}
 */
export const calculateRefundAmount = (appointment, cancelledBy) => {
  const amountPaid = appointment.amountPaid || 0;

  if (amountPaid <= 0) {
    return { refundPercent: 0, refundAmount: 0, reason: 'No payment to refund' };
  }

  // Doctor rejects or cancels → 100% refund always
  if (cancelledBy === 'doctor') {
    return {
      refundPercent: 100,
      refundAmount: amountPaid,
      reason: 'Doctor cancelled/rejected — full refund'
    };
  }

  // Patient cancels → time-based policy
  const now = new Date();
  const appointmentDateTime = new Date(appointment.appointmentDate);
  // Combine date with startTime for precise check
  if (appointment.startTime) {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
  }

  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

  if (hoursUntilAppointment > 24) {
    return {
      refundPercent: 100,
      refundAmount: amountPaid,
      reason: 'Cancelled more than 24 hours before appointment — full refund'
    };
  } else if (hoursUntilAppointment >= 12) {
    const halfRefund = Math.round(amountPaid * 0.5);
    return {
      refundPercent: 50,
      refundAmount: halfRefund,
      reason: 'Cancelled between 12–24 hours before appointment — 50% refund'
    };
  } else {
    return {
      refundPercent: 0,
      refundAmount: 0,
      reason: 'Cancelled less than 12 hours before appointment — no refund'
    };
  }
};

/**
 * Initiate a refund via Razorpay Refund API.
 * Can be called internally (from appointment cancel/reject flows) or via the API route.
 *
 * @param {String} appointmentId - Appointment ObjectId
 * @param {String} cancelledBy - 'doctor' | 'patient'
 * @param {Number|null} overrideAmount - Force a specific refund amount (in ₹), or null to use policy
 * @returns {Object} { success, refundAmount, refundId, reason }
 */
export const processRefund = async (appointmentId, cancelledBy, overrideAmount = null) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('doctor', 'name')
    .populate('patient', 'name');

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Only refund if payment was completed
  if (appointment.paymentStatus !== 'completed') {
    return {
      success: false,
      refundAmount: 0,
      refundId: null,
      reason: `Payment status is "${appointment.paymentStatus}" — not eligible for refund`
    };
  }

  // Already refunded
  if (appointment.refundId) {
    return {
      success: false,
      refundAmount: 0,
      refundId: appointment.refundId,
      reason: 'Refund already processed for this appointment'
    };
  }

  // Calculate refund amount
  let refundAmount;
  let reason;

  if (overrideAmount !== null && overrideAmount >= 0) {
    refundAmount = overrideAmount;
    reason = `Manual refund override: ₹${refundAmount}`;
  } else {
    const calc = calculateRefundAmount(appointment, cancelledBy);
    refundAmount = calc.refundAmount;
    reason = calc.reason;
  }

  // No refund needed
  if (refundAmount <= 0) {
    appointment.paymentStatus = 'refunded';
    appointment.refundAmount = 0;
    appointment.status = 'cancelled';
    await appointment.save();

    return {
      success: true,
      refundAmount: 0,
      refundId: null,
      reason
    };
  }

  // Call Razorpay Refund API
  if (!appointment.razorpayPaymentId) {
    throw new Error('No Razorpay payment ID found — cannot process refund');
  }

  try {
    const refund = await razorpay.payments.refund(appointment.razorpayPaymentId, {
      amount: refundAmount * 100 // Convert ₹ to paise
    });

    // Update appointment
    appointment.paymentStatus = 'refunded';
    appointment.refundId = refund.id;
    appointment.refundAmount = refundAmount;
    appointment.status = 'cancelled';
    await appointment.save();

    // Send refund notification to patient
    try {
      const doctorName = appointment.doctor?.name || 'your doctor';
      const patientNotification = new Notification({
        user: appointment.patient._id || appointment.patient,
        type: 'payment_refund',
        message: `Refund of ₹${refundAmount} has been initiated for your appointment with Dr. ${doctorName}. It will reflect in 3-5 business days.`,
        link: '/patient/appointments',
        relatedAppointment: appointment._id
      });
      await patientNotification.save();
    } catch (notifError) {
      console.error('Error creating refund notification:', notifError);
    }

    console.log(`Refund processed: ₹${refundAmount} for appointment ${appointmentId}, refundId: ${refund.id}`);

    return {
      success: true,
      refundAmount,
      refundId: refund.id,
      reason
    };
  } catch (razorpayError) {
    console.error('Razorpay refund API error:', razorpayError);
    throw new Error(`Razorpay refund failed: ${razorpayError.message}`);
  }
};

/**
 * API endpoint: POST /api/payment/refund/:appointmentId
 * Allows a patient to request a refund for their appointment.
 */
export const initiateRefund = asyncHandler(async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Determine who is requesting the refund
    const userId = req.user._id.toString();
    const patientId = (appointment.patient._id || appointment.patient).toString();
    const doctorId = (appointment.doctor._id || appointment.doctor).toString();

    let cancelledBy;
    if (userId === patientId) {
      cancelledBy = 'patient';
    } else if (userId === doctorId) {
      cancelledBy = 'doctor';
    } else if (req.user.role === 'admin') {
      cancelledBy = 'doctor'; // Admin-initiated refunds use doctor (full) policy
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to request a refund for this appointment'
      });
    }

    const result = await processRefund(appointmentId, cancelledBy);

    res.status(200).json({
      success: result.success,
      message: result.reason,
      data: {
        refundAmount: result.refundAmount,
        refundId: result.refundId
      }
    });
  } catch (error) {
    console.error('Error initiating refund:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing refund'
    });
  }
});

/**
 * GET /api/payment/history
 * Returns all appointments for the logged-in patient where paymentStatus != 'pending'
 */
export const getPaymentHistory = asyncHandler(async (req, res) => {
  try {
    const patientId = req.user._id;

    const appointments = await Appointment.find({
      patient: patientId,
      paymentStatus: { $ne: 'pending' }
    })
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .select('doctor appointmentDate totalAmount amountPaid amountPending paymentStatus refundId refundAmount razorpayPaymentId createdAt isDeleted deletedAt deletedBy status');

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
});

/**
 * GET /api/payment/doctor-earnings
 * Returns earnings summary for the logged-in doctor
 */
export const getDoctorEarnings = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Total earnings (sum of totalAmount for completed appointments)
    const earningsAgg = await Appointment.aggregate([
      { $match: { doctor: doctorId, status: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
    const totalEarnings = earningsAgg[0]?.totalEarnings || 0;
    const totalAppointments = earningsAgg[0]?.count || 0;

    // Monthly earnings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyEarnings = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          earnings: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthly = monthlyEarnings.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      earnings: item.earnings,
      count: item.count
    }));

    // Recent payments (last 10 paid appointments)
    const recentPayments = await Appointment.find({
      doctor: doctorId,
      paymentStatus: { $in: ['completed', 'refunded'] }
    })
      .populate('patient', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('patient appointmentDate totalAmount amountPaid paymentStatus createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        totalAppointments,
        monthlyEarnings: formattedMonthly,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Error fetching doctor earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings',
      error: error.message
    });
  }
});

/**
 * POST /api/payment/webhook
 * Razorpay webhook handler — no JWT, verified via HMAC-SHA256
 * Must be mounted BEFORE express.json() with express.raw() body parser
 */
export const handleWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Verify signature
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature header' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body) // req.body is raw Buffer from express.raw()
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('Webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Parse the verified raw body
  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventType = event.event;
  const payload = event.payload;
  console.log(`[Webhook] Received event: ${eventType}`);

  try {
    switch (eventType) {
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const appointment = await Appointment.findOne({ razorpayOrderId: payment.order_id });
        if (!appointment) {
          console.warn(`[Webhook] No appointment found for order ${payment.order_id}`);
          break;
        }

        // Idempotent: skip if already completed
        if (appointment.paymentStatus === 'completed') break;

        appointment.paymentStatus = 'completed';
        appointment.razorpayPaymentId = payment.id;
        await appointment.save();

        console.log(`[Webhook] payment.captured — appointment ${appointment._id} marked completed`);
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (!payment) break;

        const appointment = await Appointment.findOne({ razorpayOrderId: payment.order_id });
        if (!appointment) {
          console.warn(`[Webhook] No appointment found for order ${payment.order_id}`);
          break;
        }

        if (appointment.paymentStatus === 'failed') break;

        appointment.paymentStatus = 'failed';
        await appointment.save();

        // Notify patient about failed payment
        await Notification.create({
          user: appointment.patient,
          type: 'payment_received',
          message: `Payment of ₹${appointment.amountPaid || 0} failed for your appointment. Please try again.`,
          relatedAppointment: appointment._id,
        });

        console.log(`[Webhook] payment.failed — appointment ${appointment._id} marked failed`);
        break;
      }

      case 'refund.processed':
      case 'refund.created': {
        const refund = payload.refund?.entity;
        if (!refund) break;

        // Find appointment by the refund's payment_id
        const appointment = await Appointment.findOne({ razorpayPaymentId: refund.payment_id });
        if (!appointment) {
          console.warn(`[Webhook] No appointment found for payment ${refund.payment_id}`);
          break;
        }

        // Idempotent: skip if refundId already matches
        if (appointment.refundId === refund.id) break;

        appointment.paymentStatus = 'refunded';
        appointment.refundId = refund.id;
        appointment.refundAmount = refund.amount / 100; // Razorpay amounts are in paise
        await appointment.save();

        // Notify patient about refund
        await Notification.create({
          user: appointment.patient,
          type: 'payment_refund',
          message: `Refund of ₹${appointment.refundAmount} has been processed for your appointment.`,
          relatedAppointment: appointment._id,
        });

        console.log(`[Webhook] ${eventType} — appointment ${appointment._id} refund processed`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`);
    }

    // Always return 200 to Razorpay to prevent retries
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error(`[Webhook] Error processing ${eventType}:`, error);
    // Return 200 anyway to prevent Razorpay from retrying on our app errors
    res.status(200).json({ status: 'error', message: error.message });
  }
};
