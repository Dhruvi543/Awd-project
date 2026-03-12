import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../common/enums/enumConstant';
import PasswordInput from '../../components/forms/PasswordInput';
import logo from '../../logo.png';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError, user, isAuthenticated } = useAuth();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // If logged in as non-admin, redirect to their dashboard
        if (user.role === UserRole.PATIENT) {
          navigate('/patient/dashboard', { replace: true });
        } else if (user.role === UserRole.DOCTOR) {
          navigate('/doctor/dashboard', { replace: true });
        }
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateEmail = (email) => {
    // Email validation - only allows .com extension
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    return emailRegex.test(email.trim());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    
    // Clear errors when user types
    if (loginErrors[name]) {
      setLoginErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    
    setLoginErrors({});
    setIsLoading(true);
    
    // Admin login - never use rememberMe for security
    const result = await login({ email, password, rememberMe: false });
    setIsLoading(false);
    
    if (result.success) {
      // Check if user is admin
      const currentUser = result.user || JSON.parse(localStorage.getItem('user'));
      if (currentUser && currentUser.role === UserRole.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setLoginErrors({ general: 'Access denied. Admin credentials required.' });
        // Clear the non-admin user from localStorage
        localStorage.removeItem('user');
      }
    } else {
      setLoginErrors({ general: result.error || 'Login failed. Please check your credentials.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transition-colors duration-200 relative">
        {/* Back Button - Top Left Corner */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          aria-label="Go back to home"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        
        {/* Header with Logo and Theme Toggle */}
        <div className="px-8 pt-8 text-center relative">
          <button
            onClick={toggleTheme}
            className="absolute top-8 right-8 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
          
          <img 
            src={logo} 
            alt="DOXI" 
            className="w-24 h-24 mx-auto"
            style={{
              filter: theme === 'dark' ? 'invert(1) brightness(1.2)' : 'none'
            }}
          />
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white">Admin Login</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Secure access to DOXI admin panel</p>
        </div>

        {error && (
          <div className="mx-8 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loginErrors.general && (
          <div className="mx-8 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            {loginErrors.general}
          </div>
        )}

        {/* Login Form */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="admin-email"
                name="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  loginErrors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your email address"
              />
              {loginErrors.email && <p className="mt-1 text-sm text-red-500">{loginErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <PasswordInput
                id="admin-password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={handleChange}
                required
                hasError={!!loginErrors.password}
                placeholder="Enter your password"
              />
              {loginErrors.password && <p className="mt-1 text-sm text-red-500">{loginErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
