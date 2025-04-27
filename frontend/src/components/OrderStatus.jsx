import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import bakeryService from '../services/bakeryService';

const OrderStatus = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await bakeryService.getOrderStatus(id);
        setOrder(data);
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const intervalId = setInterval(fetchOrder, 3000); // Poll every 3 seconds
    fetchOrder(); // Initial fetch

    // Cleanup function
    return () => clearInterval(intervalId);
  }, [id]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-warning';
      case 'PROCESSING':
        return 'bg-info';
      case 'COMPLETED':
        return 'bg-success';
      case 'CANCELLED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading order details...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  if (!order) {
    return <div className="alert alert-warning mt-3">Order not found</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Order #{order.id}</h2>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Order Status</span>
          <span className={`badge ${getStatusBadgeClass(order.status)}`}>
            {order.status}
          </span>
        </div>
        <div className="card-body">
          <p className="card-text">
            <strong>Order Date:</strong>{' '}
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p className="card-text">
            <strong>Total Amount:</strong> ${order.total.toFixed(2)}
          </p>
        </div>
      </div>

      <h4>Order Items</h4>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>{item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.status === 'PENDING' && (
        <div className="alert alert-info mt-4">
          Your order has been received and will be processed shortly.
        </div>
      )}

      {order.status === 'PROCESSING' && (
        <div className="alert alert-info mt-4">
          Your order is currently being prepared.
        </div>
      )}

      {order.status === 'COMPLETED' && (
        <div className="alert alert-success mt-4">
          Your order has been completed!
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div className="alert alert-danger mt-4">
          Your order has been cancelled.
        </div>
      )}
    </div>
  );
};

export default OrderStatus;
