import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../api/apiService';
import { UserRole } from '../common/enums/enumConstant';

const AuthContext = createContext();

const initialState = {
  user: (() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        if (user.id && !user._id) {
          localStorage.setItem('user', JSON.stringify(normalizedUser));
        }
        return normalizedUser;
      }
      return null;
    } catch (_) {
      localStorage.removeItem('user');
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
      try {
        localStorage.removeItem('user');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      return {
        ...state,
        user: null,
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
    const restoreAuthState = () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            const normalizedUser = {
              ...user,
              _id: user._id || user.id
            };
            
            dispatch({ 
              type: 'LOGIN_SUCCESS', 
              payload: { 
                user: normalizedUser 
              } 
            });
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT_SUCCESS' });
          }
        } else {
          dispatch({ type: 'LOGOUT_SUCCESS' });
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
      }
    };

    restoreAuthState();

    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === null) {
        restoreAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.data.success && response.data.data) {
        const userData = response.data.data;
        const normalizedUser = {
          ...userData,
          _id: userData._id || userData.id
        };
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        dispatch({ type: 'SET_USER', payload: normalizedUser });
        return normalizedUser;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      if (error.response?.status === 401) {
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
      const { user, approvalMessage, rejectionReason, isRejected, isPending } = response.data;
      
      if (isRejected) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.data.message });
        return { 
          success: false, 
          error: response.data.message,
          isRejected: true,
          rejectionReason: rejectionReason
        };
      }
      
      if (isPending) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.data.message });
        return { 
          success: false, 
          error: response.data.message,
          isPending: true
        };
      }
      
      if (user) {
        const normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: normalizedUser } });
        return { 
          success: true, 
          user: normalizedUser,
          approvalMessage: approvalMessage 
        };
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed: Unexpected response format' });
      return { success: false, error: 'Login failed: Unexpected response format' };
    } catch (error) {
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
      const { user, message } = response.data;
      let normalizedUser = null;
      let isApproved = user?.isApproved;
      
      if (user) {
        normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        // For doctors pending approval, the API returns user without approval
        if (userData.role !== 'doctor' || isApproved) {
           localStorage.setItem('user', JSON.stringify(normalizedUser));
        }
      }
      dispatch({ type: 'REGISTER_SUCCESS', payload: { user: normalizedUser } });
      return { 
        success: true, 
        isDoctor: userData.role === 'doctor',
        hasToken: userData.role !== 'doctor' || isApproved,
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
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT_SUCCESS' });
    }
    return { success: true };
  };

  const googleLogin = async (credential) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await apiService.googleLogin(credential);
      const { user, isNewGoogleLink, isNewUser, isRejected, isPending, rejectionReason } = response.data;
      
      if (isRejected) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.data.message });
        return { 
          success: false, 
          error: response.data.message,
          isRejected: true,
          rejectionReason: rejectionReason
        };
      }
      
      if (isPending) {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.data.message });
        return { 
          success: false, 
          error: response.data.message,
          isPending: true
        };
      }
      
      if (user) {
        const normalizedUser = {
          ...user,
          _id: user._id || user.id
        };
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: normalizedUser } });
        return { 
          success: true, 
          user: normalizedUser,
          isNewGoogleLink,
          isNewUser,
          message: response.data.message
        };
      }
      
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Google login failed: Unexpected response format' });
      return { success: false, error: 'Google login failed: Unexpected response format' };
    } catch (error) {
      if (error.response?.data?.isRejected) {
        const errorMessage = error.response?.data?.message || 'Google login failed';
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        return { 
          success: false, 
          error: errorMessage,
          isRejected: true,
          rejectionReason: error.response?.data?.rejectionReason
        };
      }
      if (error.response?.data?.isPending) {
        const errorMessage = error.response?.data?.message || 'Google login failed';
        dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
        return { 
          success: false, 
          error: errorMessage,
          isPending: true
        };
      }
      const errorMessage = error.response?.data?.message || 'Google login failed. Please try again.';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
    googleLogin,
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