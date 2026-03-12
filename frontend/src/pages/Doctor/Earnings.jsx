import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../api/apiService';

const Earnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchEarnings();
  }, [filter, dateRange]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await apiService.getDoctorEarningsDetailed(params);
      if (response.data.success) {
        setEarnings(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate last 6 months array
  const generateLast6Months = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        doctorShare: 0,
        count: 0
      });
    }
    return months;
  };

  // Merge backend data with all 6 months
  const monthlyEarningsData = useMemo(() => {
    const allMonths = generateLast6Months();
    if (!earnings?.monthlyBreakdown) return allMonths;
    
    // Create a map of backend data
    const backendDataMap = {};
    earnings.monthlyBreakdown.forEach(item => {
      backendDataMap[item.month] = item;
    });
    
    // Merge data
    return allMonths.map(item => ({
      ...item,
      ...(backendDataMap[item.month] || {})
    }));
  }, [earnings?.monthlyBreakdown]);

  // Calculate max earnings for chart scaling
  const maxEarnings = useMemo(() => {
    const maxValue = Math.max(...monthlyEarningsData.map(m => m.doctorShare || 0), 1);
    return maxValue;
  }, [monthlyEarningsData]);

  // Check if all months have zero earnings
  const allMonthsZero = useMemo(() => {
    return monthlyEarningsData.every(m => (m.doctorShare || 0) === 0);
  }, [monthlyEarningsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Failed to load earnings data.</p>
        <button
          onClick={fetchEarnings}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View detailed breakdown of your consultation earnings. The platform collects a percentage of your booking fee online, and you collect the remaining amount directly from patients at the clinic.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Booking Fees</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(earnings.summary.totalEarnings)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            From {earnings.summary.totalAppointments} appointments
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Collected by Platform (Online)</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(earnings.summary.totalCommission)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {earnings.currentCommissionPercentage}% platform fee
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">You Collect at Clinic</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(earnings.summary.paidEarnings)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {earnings.summary.paidAppointments} completed appointments
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Clinic Collections</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
            {formatCurrency(earnings.summary.pendingEarnings)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {earnings.summary.pendingAppointments} pending appointments
          </p>
        </div>
      </div>

      {/* Monthly Earnings Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Earnings (Last 6 Months)</h2>
        
        {/* Y-axis labels and chart container */}
        <div className="flex" style={{ height: '220px' }}>
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2 py-1" style={{ height: '180px' }}>
            <span>₹{maxEarnings.toLocaleString()}</span>
            <span>₹{Math.round(maxEarnings * 0.75).toLocaleString()}</span>
            <span>₹{Math.round(maxEarnings * 0.5).toLocaleString()}</span>
            <span>₹{Math.round(maxEarnings * 0.25).toLocaleString()}</span>
            <span>₹0</span>
          </div>
          
          {/* Chart area with grid lines */}
          <div className="flex-1 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: '180px' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-gray-200 dark:border-gray-700 w-full" />
              ))}
            </div>
            
            {/* Bars */}
            <div className="flex items-end justify-around gap-4 h-full relative z-10 px-2" style={{ height: '180px' }}>
              {monthlyEarningsData.map((item, idx) => {
                const earningsValue = item.doctorShare || 0;
                const heightPercent = maxEarnings > 0 ? (earningsValue / maxEarnings) * 100 : 0;
                const barHeight = earningsValue > 0 ? Math.max(heightPercent, 8) : 0;
                
                return (
                  <div 
                    key={idx} 
                    className="flex flex-col items-center gap-2" 
                    style={{ width: `${Math.min(100 / monthlyEarningsData.length, 20)}%`, minWidth: '60px' }}
                  >
                    <div className="text-center">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap block">
                        ₹{earningsValue.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap block">
                        {item.count || 0} appts
                      </span>
                    </div>
                    <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                      {barHeight > 0 ? (
                        <div
                          className="w-full rounded-t-md transition-all duration-500"
                          style={{ 
                            height: `${barHeight}%`,
                            background: 'linear-gradient(180deg, #4ade80, #16a34a)'
                          }}
                        />
                      ) : (
                        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Empty state message */}
        {allMonthsZero && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No earnings data for the past 6 months. Complete appointments to see your earnings here.
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Appointments</option>
              <option value="pending">Pending Payment</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="block w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="block w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={() => {
              setFilter('all');
              setDateRange({ start: '', end: '' });
            }}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Appointment Earnings Details
          </h2>
        </div>

        {earnings.appointments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4">No appointments found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Appointment Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Booking Fee
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Platform Fee ({earnings.currentCommissionPercentage}%)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    You Collect at Clinic
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {earnings.appointments.map((appointment) => (
                  <tr key={appointment.appointmentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {appointment.patientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {appointment.startTime} - {appointment.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(appointment.bookingFee || appointment.totalFee || appointment.consultationFee)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-red-600 dark:text-red-400">
                        -{formatCurrency(appointment.onlineAmount || appointment.platformCommissionAmount)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {appointment.platformFeePercentage || appointment.commissionPercentage}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(appointment.clinicAmount || appointment.doctorShareAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        appointment.appointmentStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : appointment.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {appointment.appointmentStatus === 'cancelled' ? 'Cancelled' : appointment.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {appointment.bookingFeePaidAt 
                        ? formatDateTime(appointment.bookingFeePaidAt)
                        : 'Pending'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              About Your Earnings
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                The platform collects {earnings.currentCommissionPercentage}% of your booking fee online to secure appointments. 
                You collect the remaining {100 - earnings.currentCommissionPercentage}% directly from patients at the clinic. 
                The percentage shown for each appointment was the rate at the time of booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
