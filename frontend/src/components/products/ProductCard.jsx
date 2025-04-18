// src/components/products/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      {/* Product Image */}
      <img
        src={product.image || "https://via.placeholder.com/300"} // Fallback image if no image is provided
        alt={product.name}
        className="w-full h-48 object-cover"
      />

      {/* Product Details */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p> {/* Limit description to 2 lines */}
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-orange-700">₹{product.price}</span>
          <button
            onClick={() => onAddToCart(product.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
