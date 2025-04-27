const express = require('express');
const morgan = require('morgan');
const cors = require('cors'); // Middleware for handling CORS
const cookieParser = require('cookie-parser');
const bakeryRouter = require('./routes/index.js');
const bakeryService = require('./services/bakeryService');
require('dotenv').config();

async function startServer() {
  try {
    // Wait for RabbitMQ connection to be established
    console.log('Establishing RabbitMQ connection...');
    await bakeryService.connectPromise;
    console.log('RabbitMQ connection established successfully');

    const app = express();

    // **CORS Configuration**
    app.use(cors({
      origin: 'http://localhost:3000', // Allow only your frontend
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Include OPTIONS for preflight
      allowedHeaders: ['Content-Type', 'Authorization'], // Match headers sent by frontend
      credentials: true, // If you're using cookies or authentication tokens
    }));

    // Middleware (order matters: cors first, then others)
    app.use(express.json()); // Parse JSON request bodies
    app.use(morgan('dev')); // Log HTTP requests
    app.use(cookieParser()); // Parse cookies

    // Routes
    app.use('/api', bakeryRouter);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK' });
    });

    // Catch-all 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Global error:', err.stack);
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    });

    // Start the server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Startup failed:', error);
    console.error('Error details:', error.message);
    process.exit(1); // Exit with failure code
  }
}

startServer();