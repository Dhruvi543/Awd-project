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

  useEffect(() => {
    // Skip fetching profile for now; backend doesn't expose it yet.
  }, []);

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
      const { user, token } = response.data;
      if (user) {
        // Normalize user object: ensure _id exists (backend returns id, MongoDB uses _id)
        const normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: normalizedUser, token: token || null } });
        return { success: true, user: normalizedUser };
      }
      if (token) {
        localStorage.setItem('token', token);
      }
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: null, token: token || null } });
      return { success: true, user: null };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const response = await apiService.register(userData);
      const { user, token } = response.data;
      let normalizedUser = null;
      if (user) {
        // Normalize user object: ensure _id exists (backend returns id, MongoDB uses _id)
        normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      }
      if (token) {
        localStorage.setItem('token', token);
      }
      dispatch({ type: 'REGISTER_SUCCESS', payload: { user: normalizedUser, token: token || null } });
      return { success: true };
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