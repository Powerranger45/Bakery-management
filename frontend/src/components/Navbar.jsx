// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Call the logout function from AuthContext
    navigate('/login'); // Redirect to the login page
  };

  return (
    <nav className="bg-orange-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div>
            <Link to="/" className="text-white font-bold text-xl">
              🍞 The Sweet Crust Bakery
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className="text-white hover:text-orange-200 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-white hover:text-orange-200 transition-colors"
            >
              Products
            </Link>
            {user && (
              <Link
                to="/cart"
                className="relative text-white hover:text-orange-200 transition-colors"
              >
                Cart
                {/* Cart Count Badge */}
                <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  3 {/* Replace with actual cart count from context or API */}
                </span>
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-white font-medium hidden md:block">
                  Welcome, {user.username}!
                </span>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
