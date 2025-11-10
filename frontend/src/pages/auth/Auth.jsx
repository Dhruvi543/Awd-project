import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { UserRole } from '../../common/enums/enumConstant';
import PatientRegisterForm from '../../components/auth/PatientRegisterForm';
import DoctorRegisterForm from '../../components/auth/DoctorRegisterForm';
import logo from '../../logo.png';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Set initial tab based on current route
    return location.pathname === '/register' ? 'register' : 'login';
  });
  const [role, setRole] = useState('patient'); // register tab role

  const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: false });
  const [loginErrors, setLoginErrors] = useState({});
  const [patientData, setPatientData] = useState({});
  const [doctorData, setDoctorData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, error, clearError, user, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  // Update active tab when route changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
    } else if (location.pathname === '/login') {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // Redirect based on role after login/register
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === UserRole.PATIENT) {
        navigate('/patient/dashboard', { replace: true });
      } else if (user.role === UserRole.DOCTOR) {
        navigate('/doctor/dashboard', { replace: true });
      } else if (user.role === UserRole.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onChangeLogin = (e) => {
    const { name, value, type, checked } = e.target;
    // Map 'username' field name to 'email' in state
    const fieldName = name === 'username' ? 'email' : name;
    setLoginData((prev) => ({ 
      ...prev, 
      [fieldName]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear errors when user types
    if (loginErrors[fieldName]) {
      setLoginErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
    if (error) clearError();
  };

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    
    // Validate login form
    const errors = {};
    if (!loginData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(loginData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!loginData.password) {
      errors.password = 'Password is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    
    setLoginErrors({});
    setIsLoading(true);
    const result = await login(loginData);
    setIsLoading(false);
    
    // Redirect will happen automatically via useEffect when user state updates
  };

  const onSubmitRegister = async (e) => {
    e.preventDefault();
    const data = role === 'patient' ? patientData : doctorData;
    if (data.password !== data.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsLoading(true);
    const userData = { role, ...data };
    if (role === 'doctor') {
      userData.name = `${data.firstName} ${data.lastName}`;
    } else if (role === 'patient') {
      userData.name = data.fullName;
    }
    const result = await register(userData);
    setIsLoading(false);
    
    // Redirect will happen automatically via useEffect when user state updates
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transition-colors duration-200">
      <div className="px-8 pt-8 text-center">
        <img 
          src={logo} 
          alt="DOXI" 
          className="w-24 h-24 mx-auto"
          style={{
            filter: theme === 'dark' ? 'invert(1) brightness(1.2)' : 'none'
          }}
        />
        <h1 className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white">Welcome to DOXI</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">Your gateway to simple, secure healthcare</p>
      </div>

      <div className="mt-6 px-8">
        <div className="flex rounded-lg bg-blue-50 dark:bg-blue-900/30 p-1 text-sm font-medium text-blue-700 dark:text-blue-300">
          <button
            onClick={() => {
              setActiveTab('login');
              navigate('/login', { replace: true });
            }}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${activeTab === 'login' ? 'bg-white dark:bg-gray-700 shadow text-blue-700 dark:text-blue-300' : 'hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              navigate('/register', { replace: true });
            }}
            className={`flex-1 px-4 py-2 rounded-md transition-colors ${activeTab === 'register' ? 'bg-white dark:bg-gray-700 shadow text-blue-700 dark:text-blue-300' : 'hover:bg-blue-100 dark:hover:bg-blue-900/50'}`}
          >
            Create Account
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="px-8 py-6">
        {activeTab === 'login' ? (
          <form 
            onSubmit={onSubmitLogin} 
            className="space-y-6" 
            autoComplete="on"
            name="login-form"
            id="login-form"
            method="post"
            action="#"
          >
            {/* Email field - marked as username for password managers */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <input
                type="email"
                id="login-email"
                name="username"
                autoComplete="username"
                inputMode="email"
                value={loginData.email}
                onChange={onChangeLogin}
                required
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  loginErrors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your email address"
              />
              {loginErrors.email && <p className="mt-1 text-sm text-red-500">{loginErrors.email}</p>}
            </div>
            
            {/* Password field */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                autoComplete="current-password"
                value={loginData.password}
                onChange={onChangeLogin}
                required
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  loginErrors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your password"
              />
              {loginErrors.password && <p className="mt-1 text-sm text-red-500">{loginErrors.password}</p>}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                autoComplete="off"
                checked={loginData.rememberMe}
                onChange={onChangeLogin}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              New here?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setActiveTab('register');
                  navigate('/register', { replace: true });
                }} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Create an account
              </button>
            </div>
          </form>
        ) : (
          <form 
            onSubmit={onSubmitRegister} 
            className="space-y-5" 
            autoComplete="off"
            name="register-form"
            id="register-form"
            data-form-type="register"
            data-lpignore="true"
          >
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Register as</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {role === 'doctor' ? (
              <DoctorRegisterForm setDoctorData={setDoctorData} />
            ) : (
              <PatientRegisterForm setPatientData={setPatientData} />
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setActiveTab('login');
                  navigate('/login', { replace: true });
                }} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="px-8 pb-6 text-center text-xs text-gray-500 dark:text-gray-400">
        By continuing you agree to our <Link to="#" className="underline hover:text-gray-700 dark:hover:text-gray-300">Terms</Link> and <Link to="#" className="underline hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</Link>.
      </div>
    </div>
  );
};

export default Auth;


