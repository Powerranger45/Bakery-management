import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ setActiveTab }) => {
  const navigate = useNavigate();

  const handleShopNow = () => {
    setActiveTab('products');
    navigate('/products');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="text-center max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-xl">
        {/* Title */}
        <h1 className="text-4xl font-bold text-orange-700 mb-6">Welcome to The Sweet Crust Bakery 🍞</h1>

        {/* Image */}
        <img
          src="https://images.unsplash.com/photo-1589302007495-2e353d7f6a6b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
          alt="Fresh Indian bakery items"
          className="rounded-lg shadow-md mx-auto h-72 object-cover mb-6"
        />

        {/* Description */}
        <div className="space-y-4 text-gray-700 mb-8">
          <p className="text-lg font-medium">🌟 Freshly Baked, Every Day! 🌟</p>
          <p>
            At The Sweet Crust Bakery, we bring you authentic Indian flavors with a modern twist.
            From crispy samosas to melt-in-your-mouth butter cookies, every item is crafted with love
            using the finest ingredients. Our baked goods are perfect for festivals, family gatherings,
            or just a sweet treat to brighten your day!
          </p>
          <p className="text-lg font-semibold text-green-700">
            Starting at just ₹49! 🪙
          </p>
        </div>

        {/* Call-to-Action Button */}
        <button
          onClick={handleShopNow}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full
                     transition-all duration-300 transform hover:scale-105 focus:outline-none"
        >
          Shop Now →
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
