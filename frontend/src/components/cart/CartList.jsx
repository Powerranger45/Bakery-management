// src/components/cart/CartList.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import CartItem from './CartItem';
import { toast } from 'react-hot-toast';

const CartList = () => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const { data } = await api.get('/api/cart');
        setCartItems(data);
      } catch (error) {
        toast.error('Failed to load cart. Please try again.');
      }
    };
    fetchCart();
  }, []);

  const handleRemove = async (itemId) => {
    try {
      await api.delete(`/api/cart/${itemId}`);
      setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      toast.success('Item removed from cart.');
    } catch (error) {
      toast.error('Failed to remove item. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h2>
      {cartItems.length > 0 ? (
        cartItems.map((item) => (
          <CartItem key={item.id} item={item} onRemove={handleRemove} />
        ))
      ) : (
        <p className="text-gray-600 text-center">Your cart is empty.</p>
      )}
    </div>
  );
};

export default CartList;
