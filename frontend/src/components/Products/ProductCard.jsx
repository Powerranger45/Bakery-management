import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const ProductCard = ({ product, addToCart }) => {
  const { user : currentUser } = useContext(AuthContext);
  
  return (
    <div className="card h-100">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          className="card-img-top"
          alt={product.name}
          style={{ height: '200px', objectFit: 'cover' }}
        />
      )}
      <div className="card-body">
        <h5 className="card-title">{product.name}</h5>
        <p className="card-text">{product.description}</p>
        <p className="card-text fw-bold">${product.price.toFixed(2)}</p>
        
        {/* Updated stock check logic */}
        {product.stock > 0 ? (
          <div className="d-grid">
            {currentUser ? (
              <button
                className="btn btn-primary"
                onClick={() => addToCart(product)}
              >
                Add to Cart
              </button>
            ) : (
              <button className="btn btn-secondary" disabled>
                Login to Order
              </button>
            )}
          </div>
        ) : (
          <button className="btn btn-secondary" disabled>
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;