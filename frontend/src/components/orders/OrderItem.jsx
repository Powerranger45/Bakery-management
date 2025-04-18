// src/components/orders/OrderItem.jsx
import React from 'react';

const OrderItem = ({ order }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm mb-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-indigo-800">Order #{order.id}</h3>
        <span className="text-sm text-gray-500">Qty: {order.quantity}</span>
      </div>
      <div className="space-y-2 text-gray-700">
        <p>
          <strong>Product:</strong> #{order.product_id}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          <span className="capitalize">{order.status || 'Processing'}</span>
        </p>
      </div>
    </div>
  );
};

export default OrderItem;
