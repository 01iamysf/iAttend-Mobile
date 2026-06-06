import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Helper function to handle cross-platform storage
const setTokenStorage = async (token) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', token);
  } else {
    await SecureStore.setItemAsync('token', token);
  }
};

const getTokenStorage = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  } else {
    return await SecureStore.getItemAsync('token');
  }
};

const deleteTokenStorage = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
  } else {
    await SecureStore.deleteItemAsync('token');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token and fetch user on app startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await getTokenStorage();
        if (storedToken) {
          setToken(storedToken);
          // Instead of manually setting axios defaults here, the interceptor handles it.
          await fetchUserProfile();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      await logout();
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      await setTokenStorage(data.token);
      setToken(data.token);
      setUser(data);
      
      return { success: true, role: data.role };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Optional: Call backend to invalidate token if your backend requires it
    } catch (err) {
      console.error('Error during backend logout', err);
    } finally {
      await deleteTokenStorage();
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
