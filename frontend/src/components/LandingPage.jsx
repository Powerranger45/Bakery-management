import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div>
      <div className="container col-xxl-8 px-4 py-5">
        <div className="row flex-lg-row-reverse align-items-center g-5 py-5">
          <div className="col-10 col-sm-8 col-lg-6">
            <img
              src="https://placehold.co/600x400?text=Bakery+Banner"
              className="d-block mx-lg-auto img-fluid rounded"
              alt="Bakery Banner"
              width="700"
              height="500"
              loading="lazy"
            />
          </div>
          <div className="col-lg-6">
            <h1 className="display-5 fw-bold text-body-emphasis lh-1 mb-3">
              Welcome to Our Bakery
            </h1>
            <p className="lead">
              Discover our delicious selection of freshly baked goods. From artisanal breads to
              decadent pastries, we have something for everyone.
            </p>
            <div className="d-grid gap-2 d-md-flex justify-content-md-start">
              <Link to="/products" className="btn btn-primary btn-lg px-4 me-md-2">
                View Products
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-5" id="featured-bakery">
        <h2 className="pb-2 border-bottom">Why Choose Our Bakery?</h2>
        <div className="row g-4 py-5 row-cols-1 row-cols-lg-3">
          <div className="col d-flex align-items-start">
            <div>
              <h3 className="fw-bold mb-0 fs-4">Fresh Ingredients</h3>
              <p>
                We use only the finest, freshest ingredients in all our bakery products.
              </p>
            </div>
          </div>
          <div className="col d-flex align-items-start">
            <div>
              <h3 className="fw-bold mb-0 fs-4">Artisanal Craftsmanship</h3>
              <p>
                Our bakers are skilled artisans with years of experience in traditional baking methods.
              </p>
            </div>
          </div>
          <div className="col d-flex align-items-start">
            <div>
              <h3 className="fw-bold mb-0 fs-4">Daily Fresh Bakes</h3>
              <p>
                All our products are baked fresh daily to ensure maximum flavor and quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
