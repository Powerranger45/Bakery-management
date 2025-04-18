// src/components/products/ProductList.jsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import ProductCard from './ProductCard';
import { toast } from 'react-hot-toast';

const ProductList = () => {
  const [products, setProducts] = useState([]);

  // Fetch products from the backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/api/products');
        setProducts(data);
      } catch (error) {
        toast.error('Failed to load products. Please try again.');
      }
    };
    fetchProducts();
  }, []);

  // Add product to cart
  const handleAddToCart = async (productId) => {
    try {
      await api.post('/api/cart', { product_id: productId, quantity: 1 });
      toast.success('Product added to cart!');
    } catch (error) {
      toast.error('Failed to add product to cart. Please try again.');
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Products 🍞</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full">No products available.</p>
        )}
      </div>
    </div>
  );
};

export default ProductList;
