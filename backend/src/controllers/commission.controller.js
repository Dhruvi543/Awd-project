import asyncHandler from '../utils/asyncHandler.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';

/**
 * Get current platform fee settings
 * Public endpoint
 */
const getCommissionSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    
    res.json({
      success: true,
      data: {
        platformFeePercentage: settings.platformFeePercentage || settings.platformCommissionPercentage || 20,
        lastUpdated: settings.platformFeeLastUpdated || settings.commissionLastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching platform fee settings',
      error: error.message
    });
  }
});

/**
 * Update platform fee settings (Admin only)
 * Notifies all active doctors
 */
const updateCommissionSettings = asyncHandler(async (req, res) => {
  try {
    const { platformFeePercentage } = req.body;
    
    // Validate percentage
    const percentage = parseInt(platformFeePercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Platform fee percentage must be between 0 and 100'
      });
    }
    
    // Get current settings
    const settings = await Setting.getSettings();
    const oldPercentage = settings.platformFeePercentage || settings.platformCommissionPercentage || 20;
    
    // Update settings
    settings.platformFeePercentage = percentage;
    settings.platformFeeLastUpdated = new Date();
    // Also update legacy field for backward compatibility
    settings.platformCommissionPercentage = percentage;
    settings.commissionLastUpdated = new Date();
    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;
    
    await settings.save();
    
    // Create notifications for all active doctors
    const doctors = await User.find({ 
      role: 'doctor', 
      isDeleted: { $ne: true },
      isApproved: true
    }).select('_id');
    
    const notifications = doctors.map(doctor => ({
      user: doctor._id,
      type: 'commission_changed',
      message: `Platform fee has been updated from ${oldPercentage}% to ${percentage}%. This percentage of your booking fee will be collected online by the platform.`,
      link: '/doctor/earnings'
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    res.json({
      success: true,
      message: 'Platform fee settings updated successfully',
      data: {
        platformFeePercentage: percentage,
        lastUpdated: settings.platformFeeLastUpdated,
        doctorsNotified: notifications.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating platform fee settings',
      error: error.message
    });
  }
});

/**
 * Get detailed earnings breakdown for logged-in doctor
 * NEW BUSINESS MODEL:
 * - Doctor sets bookingFee (total fee)
 * - Patient pays platformFeePercentage% online (goes to platform)
 * - Doctor collects remaining at clinic
 */
const getDoctorEarningsDetailed = asyncHandler(async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    // Get current platform fee settings
    const settings = await Setting.getSettings();
    const currentPlatformFeePercentage = settings.platformFeePercentage || settings.platformCommissionPercentage || 20;
    
    // Get all appointments for this doctor
    const appointments = await Appointment.find({
      doctor: doctorId,
      status: { $ne: 'deleted' }
    })
      .populate('patient', 'name')
      .sort({ createdAt: -1 })
      .select('patient appointmentDate startTime endTime totalFee onlineAmount clinicAmount platformFeePercentage paymentStatus status onlinePaymentAt createdAt totalAmount amountPaid amountPending commissionPercentage platformCommissionAmount doctorShareAmount bookingFeePaidAt razorpayPaymentId');
    
    // Calculate summary totals
    let totalBookingFees = 0;
    let totalOnlinePayments = 0;  // Platform revenue
    let totalClinicCollections = 0;  // Doctor earnings
    let totalAppointments = 0;
    let pendingAppointments = 0;
    let paidAppointments = 0;
    
    const formattedAppointments = appointments.map(apt => {
      // Use new fields if available, fallback to legacy fields
      const bookingFee = apt.totalFee || apt.totalAmount || 0;
      const onlineAmount = apt.onlineAmount || apt.amountPaid || 0;
      const clinicAmount = apt.clinicAmount || apt.amountPending || 0;
      const platformFeePercent = apt.platformFeePercentage || apt.commissionPercentage || currentPlatformFeePercentage;
      
      // Determine payment status
      const isPaid = apt.paymentStatus === 'completed' || apt.paymentStatus === 'paid';
      const isPending = apt.paymentStatus === 'pending' || apt.status === 'pending';
      const isCancelled = apt.status === 'cancelled';
      
      // Count appointments
      totalAppointments++;
      if (isPaid && !isCancelled) {
        paidAppointments++;
        totalBookingFees += bookingFee;
        totalOnlinePayments += onlineAmount;
        totalClinicCollections += clinicAmount;
      } else if (isPending && !isCancelled) {
        pendingAppointments++;
      }
      
      return {
        _id: apt._id,
        appointmentId: apt._id,
        patientName: apt.patient?.name || 'Unknown',
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        // Use correct terminology
        bookingFee: bookingFee,
        onlineAmount: onlineAmount,  // Collected by platform
        clinicAmount: clinicAmount,  // Doctor collects at clinic
        platformFeePercentage: platformFeePercent,
        onlinePaymentAt: apt.onlinePaymentAt || apt.bookingFeePaidAt || apt.createdAt,
        paymentStatus: isPaid ? 'paid' : 'pending',
        appointmentStatus: apt.status
      };
    });
    
    // Monthly earnings breakdown
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const monthlyEarnings = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          paymentStatus: { $in: ['completed', 'paid'] },
          status: { $ne: 'cancelled' },
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalBookingFees: { $sum: { $ifNull: ['$totalFee', '$totalAmount'] } },
          totalOnlinePayments: { $sum: { $ifNull: ['$onlineAmount', '$amountPaid'] } },
          totalClinicCollections: { $sum: { $ifNull: ['$clinicAmount', '$amountPending'] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthly = monthlyEarnings.map(item => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      bookingFees: item.totalBookingFees,
      onlinePayments: item.totalOnlinePayments,  // Platform collected
      clinicCollections: item.totalClinicCollections,  // Doctor collects
      doctorShare: item.totalClinicCollections,  // For chart compatibility
      count: item.count
    }));
    
    res.json({
      success: true,
      data: {
        currentCommissionPercentage: currentPlatformFeePercentage,
        summary: {
          totalEarnings: totalClinicCollections,  // Doctor's actual earnings
          pendingEarnings: 0,  // No pending - doctor collects at clinic
          paidEarnings: totalClinicCollections,
          totalCommission: totalOnlinePayments,  // Platform revenue
          totalBookingFees: totalBookingFees,
          totalAppointments,
          pendingAppointments,
          paidAppointments
        },
        appointments: formattedAppointments,
        monthlyBreakdown: formattedMonthly
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed earnings',
      error: error.message
    });
  }
});

/**
 * Get admin revenue statistics
 * NEW BUSINESS MODEL:
 * - Platform collects platformFeePercentage% of doctor's bookingFee online
 * - This entire online amount is platform revenue
 * - Doctor collects remaining at clinic
 */
const getAdminRevenueStats = asyncHandler(async (req, res) => {
  try {
    const { groupBy = 'month', startDate, endDate } = req.query;
    
    // Get current platform fee settings
    const settings = await Setting.getSettings();
    const currentPlatformFeePercentage = settings.platformFeePercentage || settings.platformCommissionPercentage || 20;
    
    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Total revenue stats - use new fields with fallback to legacy
    const revenueAgg = await Appointment.aggregate([
      { $match: { paymentStatus: { $in: ['completed', 'paid'] }, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalBookingFees: { $sum: { $ifNull: ['$totalFee', '$totalAmount'] } },
          totalPlatformRevenue: { $sum: { $ifNull: ['$onlineAmount', '$amountPaid'] } },
          totalDoctorCollections: { $sum: { $ifNull: ['$clinicAmount', '$amountPending'] } },
          totalRefunds: { $sum: '$refundAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totals = revenueAgg[0] || {
      totalBookingFees: 0,
      totalPlatformRevenue: 0,
      totalDoctorCollections: 0,
      totalRefunds: 0,
      count: 0
    };
    
    // Build breakdown aggregation based on groupBy
    let breakdownAgg;
    const now = new Date();
    
    if (groupBy === 'day') {
      // Group by day for last 30 days
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      breakdownAgg = await Appointment.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['completed', 'paid'] },
            createdAt: { $gte: thirtyDaysAgo, ...dateFilter.createdAt }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalRevenue: { $sum: { $ifNull: ['$totalFee', '$totalAmount'] } },
            platformRevenue: { $sum: { $ifNull: ['$onlineAmount', '$amountPaid'] } },
            doctorCollections: { $sum: { $ifNull: ['$clinicAmount', '$amountPending'] } },
            appointmentCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
      
      breakdownAgg = breakdownAgg.map(item => ({
        period: `${item._id.day} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][item._id.month - 1]} ${item._id.year}`,
        totalRevenue: item.totalRevenue,
        platformCommission: item.platformRevenue,
        doctorShare: item.doctorCollections,
        appointmentCount: item.appointmentCount
      }));
    } else if (groupBy === 'week') {
      // Group by week for last 12 weeks
      const twelveWeeksAgo = new Date(now);
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
      
      breakdownAgg = await Appointment.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['completed', 'paid'] },
            createdAt: { $gte: twelveWeeksAgo, ...dateFilter.createdAt }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              week: { $week: '$createdAt' }
            },
            totalRevenue: { $sum: { $ifNull: ['$totalFee', '$totalAmount'] } },
            platformRevenue: { $sum: { $ifNull: ['$onlineAmount', '$amountPaid'] } },
            doctorCollections: { $sum: { $ifNull: ['$clinicAmount', '$amountPending'] } },
            appointmentCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } }
      ]);
      
      breakdownAgg = breakdownAgg.map(item => ({
        period: `Week ${item._id.week}, ${item._id.year}`,
        totalRevenue: item.totalRevenue,
        platformCommission: item.platformRevenue,
        doctorShare: item.doctorCollections,
        appointmentCount: item.appointmentCount
      }));
    } else {
      // Group by month for last 12 months
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      breakdownAgg = await Appointment.aggregate([
        {
          $match: {
            paymentStatus: { $in: ['completed', 'paid'] },
            createdAt: { $gte: twelveMonthsAgo, ...dateFilter.createdAt }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalRevenue: { $sum: { $ifNull: ['$totalFee', '$totalAmount'] } },
            platformRevenue: { $sum: { $ifNull: ['$onlineAmount', '$amountPaid'] } },
            doctorCollections: { $sum: { $ifNull: ['$clinicAmount', '$amountPending'] } },
            appointmentCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      breakdownAgg = breakdownAgg.map(item => ({
        period: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        totalRevenue: item.totalRevenue,
        platformCommission: item.platformRevenue,
        doctorShare: item.doctorCollections,
        appointmentCount: item.appointmentCount
      }));
    }
    
    // Top performing doctors
    const topDoctorsAgg = await Appointment.aggregate([
      { $match: { paymentStatus: { $in: ['completed', 'paid'] }, ...dateFilter } },
      {
        $group: {
          _id: '$doctor',
          totalRevenue: { $sum: { $ifNull: ['$totalFee', '$totalAmount'] } },
          platformRevenue: { $sum: { $ifNull: ['$onlineAmount', '$amountPaid'] } },
          doctorCollections: { $sum: { $ifNull: ['$clinicAmount', '$amountPending'] } },
          appointmentCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);
    
    // Get doctor details
    const doctorIds = topDoctorsAgg.map(item => item._id);
    const doctors = await User.find({ _id: { $in: doctorIds } }).select('name email');
    const doctorMap = {};
    doctors.forEach(d => { doctorMap[d._id.toString()] = d; });
    
    const topDoctors = topDoctorsAgg.map(item => ({
      doctorId: item._id,
      doctorName: doctorMap[item._id?.toString()]?.name || 'Unknown',
      doctorEmail: doctorMap[item._id?.toString()]?.email || 'N/A',
      totalRevenue: item.totalRevenue,
      platformCommission: item.platformRevenue,
      doctorShare: item.doctorCollections,
      appointmentCount: item.appointmentCount
    }));
    
    res.json({
      success: true,
      data: {
        currentCommissionPercentage: currentPlatformFeePercentage,
        overview: {
          totalRevenue: totals.totalBookingFees,
          totalAppointments: totals.count,
          totalPlatformCommission: totals.totalPlatformRevenue,
          totalDoctorShare: totals.totalDoctorCollections
        },
        breakdown: breakdownAgg || [],
        topDoctors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue statistics',
      error: error.message
    });
  }
});

export {
  getCommissionSettings,
  updateCommissionSettings,
  getDoctorEarningsDetailed,
  getAdminRevenueStats
};

