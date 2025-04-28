const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bakeryService = require('../services/bakeryService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // replace with env for production

// Use the queue constants from bakeryService
const { QUEUES } = bakeryService;

const bakeryController = {
  // Product controllers
  async getAllProducts(req, res) {
    try {
      const products = await bakeryService.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  },

  async getProductById(req, res) {
    try {
      const product = await bakeryService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
  },

  async createProduct(req, res) {
    try {
      const product = await bakeryService.createProduct(req.body);

      // Publish product creation event (admin activity)
      if (bakeryService.channel && req.user && req.user.id) {
        bakeryService.channel.sendToQueue(
          QUEUES.USER_ACTIVITY,
          Buffer.from(
            JSON.stringify({
              userId: req.user.id,
              productId: product.id,
              action: 'create_product',
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );

        // Analytics stream
        bakeryService.channel.sendToQueue(
          QUEUES.ANALYTICS,
          Buffer.from(
            JSON.stringify({
              type: 'product_created',
              productId: product.id,
              adminId: req.user.id,
              price: product.price,
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );
      }

      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  },

  // Cart controllers
  async addToCart(req, res) {
    try {
      const { userId, productId } = req.body;
      const cartItem = await bakeryService.addToCart(userId, productId);

      // Publish cart event to all relevant queues
      if (bakeryService.channel) {
        // User activity queue
        bakeryService.channel.sendToQueue(
          QUEUES.USER_ACTIVITY,
          Buffer.from(
            JSON.stringify({
              userId,
              productId,
              action: 'add_to_cart',
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );

        // Analytics stream
        bakeryService.channel.sendToQueue(
          QUEUES.ANALYTICS,
          Buffer.from(
            JSON.stringify({
              type: 'cart_update',
              userId,
              productId,
              action: 'add',
              quantity: cartItem.quantity,
              price: cartItem.product.price,
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );
      }

      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update cart' });
    }
  },

  async getCart(req, res) {
    try {
      const cart = await bakeryService.getCart(req.params.userId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve cart' });
    }
  },

  async updateCartItem(req, res) {
    try {
      const { userId, productId } = req.params;
      const { quantity } = req.body;
      const item = await bakeryService.updateCartItem(
        userId,
        productId,
        quantity
      );

      // Publish to all relevant queues
      if (bakeryService.channel) {
        // User activity queue
        bakeryService.channel.sendToQueue(
          QUEUES.USER_ACTIVITY,
          Buffer.from(
            JSON.stringify({
              userId,
              productId,
              action: 'update_cart_item',
              quantity,
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );

        // Analytics stream
        bakeryService.channel.sendToQueue(
          QUEUES.ANALYTICS,
          Buffer.from(
            JSON.stringify({
              type: 'cart_update',
              userId,
              productId,
              action: 'update',
              quantity,
              price: item.product.price,
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );
      }

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  },

  async removeFromCart(req, res) {
    try {
      const { userId, productId } = req.params;
      await bakeryService.removeFromCart(userId, productId);

      // Publish to all relevant queues
      if (bakeryService.channel) {
        // User activity queue
        bakeryService.channel.sendToQueue(
          QUEUES.USER_ACTIVITY,
          Buffer.from(
            JSON.stringify({
              userId,
              productId,
              action: 'remove_from_cart',
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );

        // Analytics stream
        bakeryService.channel.sendToQueue(
          QUEUES.ANALYTICS,
          Buffer.from(
            JSON.stringify({
              type: 'cart_update',
              userId,
              productId,
              action: 'remove',
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );
      }

      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove item' });
    }
  },

  // Order controllers
  async placeOrder(req, res) {
    try {
      const userId = req.body.userId;
      const order = await bakeryService.placeOrder(userId);

      // bakeryService.placeOrder already handles message publishing

      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to place order' });
    }
  },

  async getOrderStatus(req, res) {
    try {
      const order = await bakeryService.getOrderStatus(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve order status' });
    }
  },

  // Auth controllers
  async register(req, res) {
    const { name, email, password, isAdmin = false } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email, and password are required' });
    }
    try {
      const existingUser = await bakeryService.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await bakeryService.createUser({
        name,
        email,
        password: hashedPassword,
        isAdmin,
      });

      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, isAdmin: newUser.isAdmin },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      // Publish to all relevant queues
      if (bakeryService.channel) {
        // User activity queue
        bakeryService.channel.sendToQueue(
          QUEUES.USER_ACTIVITY,
          Buffer.from(
            JSON.stringify({
              userId: newUser.id,
              action: 'register',
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );

        // Analytics stream
        bakeryService.channel.sendToQueue(
          QUEUES.ANALYTICS,
          Buffer.from(
            JSON.stringify({
              type: 'user_registration',
              userId: newUser.id,
              isAdmin: newUser.isAdmin,
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );

        // Notifications stream for welcome message
        bakeryService.channel.sendToQueue(
          QUEUES.NOTIFICATIONS,
          Buffer.from(
            JSON.stringify({
              type: 'welcome',
              userId: newUser.id,
              message: `Welcome to our bakery, ${email}!`,
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );
      }

      res.status(201).json({ user: newUser });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Registration failed', error: error.message });
    }
  },

  // Login endpoint
  async login(req, res) {
    const { email, password } = req.body;
    try {
      const user = await bakeryService.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      // Publish to all relevant queues
      if (bakeryService.channel) {
        // User activity queue
        bakeryService.channel.sendToQueue(
          QUEUES.USER_ACTIVITY,
          Buffer.from(
            JSON.stringify({
              userId: user.id,
              action: 'login',
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );

        // Analytics stream
        bakeryService.channel.sendToQueue(
          QUEUES.ANALYTICS,
          Buffer.from(
            JSON.stringify({
              type: 'user_login',
              userId: user.id,
              timestamp: new Date(),
            })
          ),
          { persistent: true }
        );
      }

      res.json({ user });
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Login failed', error: error.message });
    }
  },

  async getUserById(req, res) {
    try {
      const user = await bakeryService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  }
};

module.exports = bakeryController;
