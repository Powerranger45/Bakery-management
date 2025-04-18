import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to retrieve cookies
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Fetch user data from the backend
  const fetchUser = async () => {
    try {
      const response = await api.get('/api/users/me'); // Ensure the endpoint matches your backend
      setUser(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        logout(); // Log out if the token is invalid
      } else {
        console.error('Failed to fetch user data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize authentication on app load
  useEffect(() => {
    const token = getCookie('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false); // No token, so mark loading as complete
    }
  }, []);

  // Login function
  const login = (token, userData) => {
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; SameSite=Lax`;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setLoading(false);
  };

  // Logout function
  const logout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // Clear the token cookie
    delete api.defaults.headers.common['Authorization']; // Remove Authorization header
    setUser(null);
  };

  // Provide authentication context
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consuming the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
