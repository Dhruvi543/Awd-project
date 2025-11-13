import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../api/apiService';
import { UserRole } from '../common/enums/enumConstant';

const AuthContext = createContext();

const initialState = {
  user: (() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      // Only return user if both user and token exist
      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser);
        // Normalize user object: ensure _id exists (backend returns id, MongoDB uses _id)
        const normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        // Update localStorage with normalized user to fix existing sessions
        if (user.id && !user._id) {
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        }
        return normalizedUser;
      }
      // Clear stale data if token is missing
      if (storedUser && !storedToken) {
        localStorage.removeItem('user');
      }
      return null;
    } catch (_) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  })(),
  token: (() => {
    try {
      return localStorage.getItem('token') || null;
    } catch (_) {
      return null;
    }
  })(),
  isLoading: false,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
    case 'LOGOUT_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      // Ensure localStorage is synced with state
      if (action.payload.token) {
        try {
          localStorage.setItem('token', action.payload.token);
        } catch (e) {
          console.error('Error saving token to localStorage:', e);
        }
      }
      if (action.payload.user) {
        try {
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        } catch (e) {
          console.error('Error saving user to localStorage:', e);
        }
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
    case 'LOGOUT_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT_SUCCESS':
      // Clear localStorage when logging out
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      return {
        user: null,
        token: null,
        isLoading: false,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore authentication state from localStorage on mount and when localStorage changes
  useEffect(() => {
    const restoreAuthState = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          try {
            const user = JSON.parse(storedUser);
            const normalizedUser = {
              ...user,
              _id: user._id || user.id
            };
            
            // Always restore state from localStorage on mount or storage change
            // This ensures state is synced with localStorage
            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { 
                user: normalizedUser, 
                token: storedToken 
              } 
            });
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            // Clear corrupted data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            dispatch({ type: 'LOGOUT_SUCCESS' });
          }
        } else if (storedUser && !storedToken) {
          // Clear stale user data if token is missing
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT_SUCCESS' });
        } else if (!storedToken && !storedUser) {
          // If localStorage is cleared, ensure state is also cleared
          dispatch({ type: 'LOGOUT_SUCCESS' });
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
      }
    };

    // Restore on mount
    restoreAuthState();

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user' || e.key === null) {
        // null key means localStorage was cleared
        restoreAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Only run on mount - eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentUser = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        // Normalize user object: ensure _id exists (backend returns id, MongoDB uses _id)
        const normalizedUser = {
          ...userData,
          _id: userData._id || userData.id
        };
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        // Update state
        dispatch({ type: 'SET_USER', payload: normalizedUser });
        return normalizedUser;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Only clear if it's an authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT_SUCCESS' });
      }
      throw error;
    }
  };

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await apiService.login(credentials);
      const { user, token, approvalMessage, rejectionReason, isRejected, isPending } = response.data;
      
      // Handle rejection case
      if (isRejected) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.data.message });
        return { 
          success: false, 
          error: response.data.message,
          isRejected: true,
          rejectionReason: rejectionReason
        };
      }
      
      // Handle pending approval case
      if (isPending) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.data.message });
        return { 
          success: false, 
          error: response.data.message,
          isPending: true
        };
      }
      
      if (user && token) {
        // Normalize user object: ensure _id exists (backend returns id, MongoDB uses _id)
        const normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        // Store in localStorage first
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('token', token);
        // Then update state
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: normalizedUser, token: token } });
        return { 
          success: true, 
          user: normalizedUser,
          approvalMessage: approvalMessage 
        };
      }
      if (token) {
        localStorage.setItem('token', token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: null, token: token } });
        return { success: true, user: null, approvalMessage: approvalMessage };
      }
      // If no token, something went wrong
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed: No token received' });
      return { success: false, error: 'Login failed: No token received' };
    } catch (error) {
      // Check if it's a rejection or pending error
      if (error.response?.data?.isRejected) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        return { 
          success: false, 
          error: errorMessage,
          isRejected: true,
          rejectionReason: error.response?.data?.rejectionReason
        };
      }
      if (error.response?.data?.isPending) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        return { 
          success: false, 
          error: errorMessage,
          isPending: true
        };
      }
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await apiService.register(userData);
      const { user, token, message } = response.data;
      let normalizedUser = null;
      if (user) {
        // Normalize user object: ensure _id exists (backend returns id, MongoDB uses _id)
        normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        // Only store user in localStorage if they have a token (approved)
        if (token) {
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        }
      }
      if (token) {
        localStorage.setItem('token', token);
      }
      dispatch({ type: 'REGISTER_SUCCESS', payload: { user: normalizedUser, token: token || null } });
      // Return success with additional info for doctor registration
      return { 
        success: true, 
        isDoctor: userData.role === 'doctor',
        hasToken: !!token,
        message: message,
        user: normalizedUser
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    dispatch({ type: 'LOGOUT_START' });
    try {
      await apiService.logout();
    } catch (error) {
      // Even if backend logout fails, clear frontend state
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage and state, regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT_SUCCESS' });
    }
    return { success: true };
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: !!(state.user && state.token),
    login,
    register,
    logout,
    clearError,
    getCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};