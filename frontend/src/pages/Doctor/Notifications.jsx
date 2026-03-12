import React, { useEffect, useState, useMemo } from 'react';
import { apiService } from '../../api/apiService';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const DoctorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.getNotifications();
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setIsUpdating(true);
      await apiService.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setIsUpdating(true);
      await apiService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsUpdating(true);
      await apiService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((notification) => !notification.isRead);
    if (filter === 'read') return notifications.filter((notification) => notification.isRead);
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="w-full max-w-full">
      <div className="max-w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review alerts for your appointments and keep your schedule organized.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchNotifications}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdating || notifications.length === 0}
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading notifications...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No notifications to display</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => (
                <li
                  key={notification._id}
                  className="p-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {notification.type === 'appointment_request' ? '📅' : 
                       notification.type === 'appointment_confirmed' ? '✅' : 
                       notification.type === 'appointment_cancelled' ? '❌' : 
                       notification.type === 'appointment_rejected' ? '🚫' : 
                       notification.type === 'appointment_completed' ? '✔️' : '🔔'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.type === 'appointment_request' ? 'Appointment Request' : 
                           notification.type === 'appointment_confirmed' ? 'Appointment Confirmed' : 
                           notification.type === 'appointment_cancelled' ? 'Appointment Cancelled' : 
                           notification.type === 'appointment_rejected' ? 'Appointment Rejected' : 
                           notification.type === 'appointment_completed' ? 'Appointment Completed' : 'Notification'}
                        </p>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{notification.message}</p>
                      {notification.relatedUser && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.relatedUser.name} ({notification.relatedUser.email})
                        </p>
                      )}
                      {notification.relatedAppointment?.appointmentDate && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                          Appointment Date: {new Date(notification.relatedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} {notification.relatedAppointment.startTime && `at ${notification.relatedAppointment.startTime}`}
                          {notification.relatedAppointment.endTime && ` - ${notification.relatedAppointment.endTime}`}
                        </p>
                      )}
                      {notification.relatedAppointment?.prescription && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 italic">
                          Prescription: {notification.relatedAppointment.prescription}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50"
                        disabled={isUpdating}
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                      disabled={isUpdating}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorNotifications;

