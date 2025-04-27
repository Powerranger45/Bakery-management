import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Header/Navbar';
import LandingPage from './components/LandingPage';
import ProductList from './components/Products/ProductList';
import LoginForm from './components/AuthForms/LoginForm';
import RegisterForm from './components/AuthForms/RegisterForm';
import Cart from './components/Cart/Cart';
import OrderStatus from './components/OrderStatus';

// CSS
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();  // This should now work

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/LandingPage" element={<LandingPage />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderStatus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <div>All Orders (placeholder)</div>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/LandingPage" />} />  {/* Corrected fallback route */}
            </Routes>
          </main>
          <footer className="footer">
            <div className="container">
              <p>&copy; {new Date().getFullYear()} Bakery Management System</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
