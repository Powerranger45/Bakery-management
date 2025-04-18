// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './components/loading/LandingPage';
import LoginPage from './components/auth/Login';
import RegisterPage from './components/auth/Register';
import ProductList from './components/products/ProductList';
import CartList from './components/cart/CartList';
import OrderList from './components/orders/OrderList';
import { toast, Toaster } from 'react-hot-toast';
import './App.css';

// ProtectedRoute Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    toast.error('You need to log in to access this page.');
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          {/* Navbar */}
          <Navbar />

          {/* Main Content */}
          <main className="flex-grow container mx-auto p-4">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <ProductList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrderList />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>

          {/* Toast Notifications */}
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
