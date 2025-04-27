import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import bakeryService from '../../services/bakeryService';
import { AuthContext } from '../../context/AuthContext';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('bakeryCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // If no user is logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );

    setCart(updatedCart);
    localStorage.setItem('bakeryCart', JSON.stringify(updatedCart));
  };

  const removeItem = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('bakeryCart', JSON.stringify(updatedCart));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        userId: currentUser.id,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      const response = await bakeryService.placeOrder(orderData);

      // Clear cart after successful order
      localStorage.removeItem('bakeryCart');
      setCart([]);

      // Navigate to order status page
      navigate(`/order-status/${response.id}`);
    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Your Shopping Cart</h2>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {cart.length === 0 ? (
        <div className="alert alert-info mt-3">
          Your cart is empty. Browse our <a href="/products">products</a> to add items to your cart.
        </div>
      ) : (
        <>
          <div className="table-responsive mt-3">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>
                      <div className="input-group" style={{ width: '120px' }}>
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >-</button>
                        <input
                          type="number"
                          className="form-control text-center"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >+</button>
                      </div>
                    </td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end fw-bold">Total:</td>
                  <td className="fw-bold">${calculateTotal().toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="d-flex justify-content-between mt-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </button>
            <button
              className="btn btn-primary"
              onClick={placeOrder}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
