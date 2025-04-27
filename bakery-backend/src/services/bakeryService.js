const amqp = require('amqplib');
const prisma = require('../utils/prisma');
require('dotenv').config();

const MAX_RETRIES = 15; // Increased retry attempts for better resilience
const RETRY_DELAY = 5000; // Delay between retries in milliseconds

let channel;

const bakeryService = {
  // Product operations (PUBLIC)
  async getAllProducts() {
    return prisma.product.findMany();
  },

  async getProductById(id) {
    return prisma.product.findUnique({ where: { id: Number(id) } });
  },

  // Admin-only product operations
  async createProduct(data) {
    return prisma.product.create({ data });
  },

  // Cart operations
  async addToCart(userId, productId, quantity = 1) {
    return prisma.addToCart.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity },
      include: { product: true }
    });
  },

  async getCart(userId) {
    return prisma.addToCart.findMany({
      where: { userId },
      include: { product: true }
    });
  },

  async updateCartItem(userId, productId, quantity) {
    return prisma.addToCart.update({
      where: { userId_productId: { userId, productId } },
      data: { quantity },
      include: { product: true }
    });
  },

  async removeFromCart(userId, productId) {
    return prisma.addToCart.delete({
      where: { userId_productId: { userId, productId } }
    });
  },

  // Order operations
  async placeOrder(userId) {
    const cartItems = await prisma.addToCart.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const orderItems = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price
    }));

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        items: { create: orderItems }
      },
      include: { items: true }
    });

    // Send to RabbitMQ for order processing
    if (channel) {
      channel.sendToQueue(
        'order-processing',
        Buffer.from(JSON.stringify({ orderId: order.id })),
        { persistent: true }
      );
    }

    // Clear cart after order
    await prisma.addToCart.deleteMany({ where: { userId } });
    return order;
  },

  async getOrderStatus(orderId) {
    return prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true }
    });
  },

  // User operations
  async createUser(userData) {
    return prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        isAdmin: userData.isAdmin || false // Explicitly set default to false
      }
    });
  },

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  async getUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  // Expose channel for external use
  get channel() {
    return channel; // Dynamic access of the live channel value
  },

  // Expose the connection promise to ensure readiness
  connectPromise: connectRabbitMQ()
};

// RabbitMQ connection with retry logic
async function connectRabbitMQ() {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Connecting to RabbitMQ... Attempt ${retries + 1}`);
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();

      // Declare queues with durability
      await channel.assertQueue('user-activity', { durable: true });
      await channel.assertQueue('order-processing', { durable: true });

      console.log('Connected to RabbitMQ successfully');
      return;
    } catch (error) {
      console.error(`Connection failed: ${error.message}`);
      retries++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw new Error('Failed to connect to RabbitMQ after multiple attempts.');
}

// Removed redundant connection attempt — handled via connectPromise

module.exports = { ...bakeryService };
