import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import bakeryService from '../../services/bakeryService';
import ProductCard from './ProductCard';
import { AuthContext } from '../../context/AuthContext';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);

  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await bakeryService.getAllProducts();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();

    // Load cart from local storage
    const savedCart = localStorage.getItem('bakeryCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const addToCart = (product) => {
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    let updatedCart;

    if (existingItemIndex >= 0) {
      // If product already exists in cart, increment quantity
      updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
    } else {
      // Otherwise add new item with quantity 1
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(updatedCart);
    localStorage.setItem('bakeryCart', JSON.stringify(updatedCart));

    alert(`${product.name} added to cart!`);
  };

  const viewCart = () => {
    navigate('/cart');
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Bakery Products</h2>
        {currentUser && cart.length > 0 && (
          <button
            className="btn btn-outline-primary"
            onClick={viewCart}
          >
            View Cart ({cart.reduce((total, item) => total + item.quantity, 0)} items)
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="alert alert-info">No products available.</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {products.map(product => (
            <div className="col" key={product.id}>
              <ProductCard product={product} addToCart={addToCart} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
