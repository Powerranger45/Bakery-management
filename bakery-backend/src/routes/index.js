// src/routes/index.js
const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const bakeryController = require('../controllers/bakeryController');
const bakeryService = require('../services/bakeryService');
const router = express.Router();

// Product routes
router.get('/products', bakeryController.getAllProducts); // Public
router.get('/products/:id', bakeryController.getProductById); // Public
router.post('/products', adminAuth, bakeryController.createProduct); // Admin-only

// Cart routes
router.post('/cart', bakeryController.addToCart);
// Modified this route to use parameter for userId
router.get('/cart/:userId', adminAuth, bakeryController.getCart); // Protected, gets cart for logged-in user

// Order routes
router.post('/orders', bakeryController.placeOrder);
router.get('/orders/:id', bakeryController.getOrderStatus);

// Auth routes
router.post('/register', bakeryController.register);
router.post('/login', bakeryController.login);
// Fixed this line - getUserById exists in your bakeryService
router.get('/user/:id', adminAuth, (req, res) => {
  bakeryController.getUserById(req, res);
});

router.get('/status', async (req, res) => {
  try {
    // Extract token from cookies
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No token found' });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});


// RabbitMQ connection
bakeryService.connectPromise.then(() => {
  console.log('RabbitMQ connection established');
}).catch((error) => {
  console.error('Failed to connect to RabbitMQ:', error);
});

// Publish route for sending messages to RabbitMQ
router.post('/publish', async (req, res) => {
  try {
    const testMessage = { test: 'Hello RabbitMQ' };
    // Ensure channel is defined before using it
    if (!bakeryService.channel) {
      return res.status(500).json({ error: 'RabbitMQ channel not available' });
    }
    bakeryService.channel.sendToQueue(
      'user-activity',
      Buffer.from(JSON.stringify(testMessage)),
      { persistent: true }
    );
    res.json({ status: 'Message published' });
  } catch (error) {
    console.error('Error publishing message:', error);
    res.status(500).json({ error: 'Failed to publish message' });
  }
});

module.exports = router;