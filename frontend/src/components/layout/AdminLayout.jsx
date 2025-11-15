import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../api/apiService';
import logo from '../../logo.png';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [siteName, setSiteName] = useState('DOXI Admin');

  // Load site settings from localStorage
  useEffect(() => {
    const loadSiteSettings = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
        if (settings.siteName) {
          setSiteName(`${settings.siteName} Admin`);
          document.title = `${settings.siteName} - Admin Dashboard`;
        }
      } catch (err) {
        console.error('Error loading site settings:', err);
      }
    };
    
    loadSiteSettings();
    // Listen for storage changes (when settings are updated in another tab)
    window.addEventListener('storage', loadSiteSettings);
    // Also check periodically for changes
    const interval = setInterval(loadSiteSettings, 2000);
    
    return () => {
      window.removeEventListener('storage', loadSiteSettings);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await apiService.getNotificationsAdmin({ limit: 10 });
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiService.markNotificationReadAdmin(id);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsReadAdmin();
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await apiService.deleteNotificationAdmin(id);
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
      setShowNotifications(false);
    }
  };

  const handleLogout = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try {
      const result = await logout();
      if (result?.success !== false) {
        // Clear any remaining state
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin-login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear state and navigate to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/admin-login');
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/doctors', label: 'Doctor Management', icon: 'doctors' },
    { path: '/admin/patients', label: 'Patient Management', icon: 'patients' },
    { path: '/admin/appointments', label: 'Appointment Management', icon: 'appointments' },
    { path: '/admin/reviews', label: 'Review Management', icon: 'reviews' },
    { path: '/admin/availability', label: 'Availability Overview', icon: 'availability' },
    { path: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  const isActive = (path) => location.pathname === path;

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'dashboard':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'doctors':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'patients':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'appointments':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'reviews':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'availability':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'analytics':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'settings':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 border-r border-blue-200 dark:border-gray-600 transition-all duration-300 flex flex-col fixed h-screen z-40 shadow-sm`}
      >
        {/* Logo */}
        <div className="h-16 border-b border-blue-200 dark:border-gray-600 flex items-center justify-between bg-white dark:bg-gray-800 px-4">
          {sidebarOpen && (
            <Link to="/admin/dashboard" className="flex items-center flex-1 h-full min-w-0 pr-3">
              <img
                src={logo}
                alt="DOXI"
                className="h-10 w-10 object-contain flex-shrink-0"
                style={{
                  filter: theme === 'dark' ? 'invert(1) brightness(1.2)' : 'none'
                }}
              />
              <div className="ml-4 flex-1 min-w-0">
                <span className="block text-base font-bold text-blue-600 dark:text-blue-400 leading-snug truncate">
                  {siteName}
                </span>
              </div>
            </Link>
          )}
          {!sidebarOpen && (
            <Link to="/admin/dashboard" className="flex items-center justify-center w-full h-full">
              <img
                src={logo}
                alt="DOXI"
                className="h-10 w-10 object-contain"
                style={{
                  filter: theme === 'dark' ? 'invert(1) brightness(1.2)' : 'none'
                }}
              />
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-500 text-white shadow-md font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <span className={isActive(item.path) ? 'text-white' : 'text-gray-600 dark:text-gray-400'}>
                    {getIcon(item.icon)}
                  </span>
                  {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 sticky top-0 z-30 shadow-sm h-16 border-b border-gray-200 dark:border-gray-700">
          <div className="h-full px-4 md:px-6 flex items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex-shrink-0">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h2>

            <div className="flex items-center space-x-1 md:space-x-2 ml-auto">
              {/* Notifications */}
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 md:h-5 md:w-5 rounded-full bg-red-500 text-white text-[10px] md:text-xs flex items-center justify-center font-bold ring-2 ring-white dark:ring-gray-800">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[32rem] overflow-hidden flex flex-col notification-dropdown">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                      <div className="flex gap-2 items-center">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {isLoadingNotifications ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">No notifications</div>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                                !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {!notification.isRead && (
                                      <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                    )}
                                    <span className="text-lg">
                                      {notification.type === 'doctor_registered' ? '👨‍⚕️' : 
                                       notification.type === 'patient_registered' ? '👤' : '🔔'}
                                    </span>
                                    <span className={`text-sm font-medium truncate ${
                                      !notification.isRead 
                                        ? 'text-gray-900 dark:text-white' 
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {notification.type === 'doctor_registered' ? 'New Doctor' : 
                                       notification.type === 'patient_registered' ? 'New Patient' : 'Notification'}
                                    </span>
                                  </div>
                                  <p className={`text-sm mt-1 ${
                                    !notification.isRead 
                                      ? 'text-gray-900 dark:text-white font-medium' 
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  {notification.relatedUser && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {notification.relatedUser.name} ({notification.relatedUser.email})
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notification._id);
                                  }}
                                  className="ml-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0 p-1"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-700">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            // Navigate to doctors page if there are pending doctors, otherwise patients
                            const hasPendingDoctors = notifications.some(n => n.type === 'doctor_registered' && !n.isRead);
                            if (hasPendingDoctors) {
                              navigate('/admin/doctors?status=pending');
                            } else {
                              navigate('/admin/patients');
                            }
                          }}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* User Profile - at the end */}
              <div className="flex items-center space-x-2 pl-2 md:pl-3 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

