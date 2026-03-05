import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const DoctorEarnings = () => {
  const [data, setData] = useState({ totalEarnings: 0, totalAppointments: 0, monthlyEarnings: [], recentPayments: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.getDoctorEarnings();
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      refunded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const maxEarning = Math.max(...(data.monthlyEarnings.map(m => m.earnings) || [1]), 1);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400">Loading earnings...</div>;
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Earnings</h1>
          <p className="text-base text-gray-600 dark:text-gray-400">Your earnings overview and payment history</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{data.totalEarnings.toLocaleString()}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">From completed consultations</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed Appointments</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.totalAppointments}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Paid consultations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Earnings Bar Chart */}
        {data.monthlyEarnings.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Earnings (Last 6 Months)</h2>
            <div className="flex items-end gap-3 h-48">
              {data.monthlyEarnings.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">₹{item.earnings.toLocaleString()}</span>
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max((item.earnings / maxEarning) * 100, 4)}%`, minHeight: '8px' }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.month}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{item.count} appts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Payments</h2>
          </div>
          {data.recentPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No payment records yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Paid Online</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.recentPayments.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{p.patient?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(p.appointmentDate)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">₹{p.totalAmount || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">₹{p.amountPaid || 0}</td>
                      <td className="px-4 py-3">{getStatusBadge(p.paymentStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorEarnings;
