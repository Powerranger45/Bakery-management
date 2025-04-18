// src/components/cart/CartItem.jsx
import React from 'react';

const CartItem = ({ item, onRemove }) => {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
        <p className="text-sm text-gray-600">
          Price: ${(item.product.price * item.quantity).toFixed(2)}
        </p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
      >
        Remove
      </button>
    </div>
  );
};

export default CartItem;
