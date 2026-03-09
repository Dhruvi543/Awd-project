import React, { useState, useEffect } from 'react';
import { apiService } from '../../api/apiService';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalRefunds: 0, pendingRefunds: 0, monthlyRevenue: [] });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = async () => {
    try {
      const res = await apiService.getAdminPaymentStats();
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching payment stats:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const params = { page: pagination.page, limit: 15 };
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await apiService.getAdminPayments(params);
      if (res.data.success) {
        setPayments(res.data.data || []);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      refunded: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Simple bar chart using divs
  const maxRevenue = Math.max(...(stats.monthlyRevenue.map(m => m.revenue) || [1]), 1);

  return (
    <div className="w-full max-w-full">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payments</h1>
          <p className="text-base text-gray-600 dark:text-gray-400">Platform revenue from online payments and transaction history</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Platform Revenue (Online)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRefunds.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Refunds</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingRefunds}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue Bar Chart */}
        {stats.monthlyRevenue.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Platform Revenue (Last 6 Months)</h2>
            <div className="flex items-end justify-around gap-4 h-48 px-4">
              {stats.monthlyRevenue.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2" style={{ width: `${Math.min(100 / stats.monthlyRevenue.length, 20)}%`, minWidth: '60px' }}>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">₹{item.revenue.toLocaleString()}</span>
                  <div className="w-full flex items-end" style={{ height: '120px' }}>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-500"
                      style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPagination(p => ({ ...p, page: 1 })); }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => { setFilters({ status: '', startDate: '', endDate: '' }); setPagination(p => ({ ...p, page: 1 })); }}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading transactions...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No transactions found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Patient</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Doctor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Booking Fee</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Online Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Clinic Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Txn ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map(p => (
                      <tr key={p._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${p.isDeleted ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div>
                            <p>{p.patient?.name || '—'}</p>
                            {p.isDeleted && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 mt-1">
                                {p.status === 'cancelled' ? 'Cancelled' : 'Deleted'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">Dr. {p.doctor?.name || '—'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{p.doctor?.specialization || ''}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(p.appointmentDate)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">₹{p.totalFee || p.amountPaid + (p.amountPending || 0) || 0}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-semibold">₹{p.amountPaid || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">₹{p.clinicAmount || p.amountPending || 0}</td>
                        <td className="px-4 py-3">{getStatusBadge(p.paymentStatus)}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">{p.razorpayPaymentId ? p.razorpayPaymentId.slice(-12) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      className="px-3 py-1 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
