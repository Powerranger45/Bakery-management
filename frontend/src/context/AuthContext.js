import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api"; // Use env variable with fallback

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated by validating session
    const checkAuthStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/status`, { withCredentials: true });
        if (res.data && res.data.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.log('No active session');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password
      }, { withCredentials: true }); // Important: allow cookies to be set

      if (res.data && res.data.user) {
        setUser(res.data.user);
      }
      
      setError('');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      console.error('Login error:', err.response?.data || err);
      throw err;
    }
  };

  const register = async ({ name, email, password }) => {
    try {
      const res = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password
      }, { withCredentials: true }); // Important: allow cookies to be set

      if (res.data && res.data.user) {
        setUser(res.data.user);
      }
      
      setError('');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      console.error('Registration error:', err.response?.data || err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user data even if the server request fails
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};