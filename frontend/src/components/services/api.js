// src/components/services/api.js
import axios from 'axios';

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api', // Default backend URL
  timeout: 10000, // Timeout after 10 seconds
});

// Request Interceptor: Add Authorization token to headers if available
api.interceptors.request.use(
  (config) => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors and success messages
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // No response received from the server
      console.error('No response received from the server.');
    } else {
      // Something else went wrong
      console.error('Error setting up the request:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const login = (credentials) => api.post('/login', credentials);
export const register = (userData) => api.post('/register', userData);
export const fetchUser = () => api.get('/users/me');
export const logout = () => api.post('/logout');

// Product Endpoints
export const fetchProducts = () => api.get('/products');
export const addProduct = (productData) => api.post('/products', productData);
export const updateProduct = (productId, productData) =>
  api.put(`/products/${productId}`, productData);
export const deleteProduct = (productId) => api.delete(`/products/${productId}`);

// Cart Endpoints
export const fetchCart = () => api.get('/cart');
export const addToCart = (cartItem) => api.post('/cart', cartItem);
export const removeFromCart = (itemId) => api.delete(`/cart/${itemId}`);
export const clearCart = () => api.delete('/cart');

// Order Endpoints
export const fetchOrders = () => api.get('/orders');
export const placeOrder = (orderData) => api.post('/orders', orderData);

export default api;
