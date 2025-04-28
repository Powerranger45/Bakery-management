const amqp = require('amqplib');
const prisma = require('../utils/prisma');
require('dotenv').config();

const MAX_RETRIES = 15; // Increased retry attempts for better resilience
const RETRY_DELAY = 5000; // Delay between retries in milliseconds

let channel;

// Define all queue names as constants to ensure consistency
const QUEUES = {
  USER_ACTIVITY: 'user-activity',
  ORDER_PROCESSING: 'order-processing',
  ANALYTICS: 'analytics-stream',
  NOTIFICATIONS: 'notifications-stream'
};

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
      // Send to order processing queue
      channel.sendToQueue(
        QUEUES.ORDER_PROCESSING,
        Buffer.from(JSON.stringify({ orderId: order.id })),
        { persistent: true }
      );

      // Send to user activity queue
      channel.sendToQueue(
        QUEUES.USER_ACTIVITY,
        Buffer.from(
          JSON.stringify({
            userId,
            orderId: order.id,
            action: 'order_created',
            orderTotal: total,
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );

      // Send to analytics stream
      channel.sendToQueue(
        QUEUES.ANALYTICS,
        Buffer.from(
          JSON.stringify({
            type: 'order',
            userId,
            orderId: order.id,
            total,
            itemCount: orderItems.length,
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );

      // Send to notifications stream
      channel.sendToQueue(
        QUEUES.NOTIFICATIONS,
        Buffer.from(
          JSON.stringify({
            type: 'new_order',
            userId,
            orderId: order.id,
            message: `New order #${order.id} placed`,
            timestamp: new Date(),
          })
        ),
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

  // Export queues for external use
  QUEUES,

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

      // Declare all queues with durability
      console.log('Declaring queues...');
      await channel.assertQueue(QUEUES.USER_ACTIVITY, { durable: true });
      await channel.assertQueue(QUEUES.ORDER_PROCESSING, { durable: true });
      await channel.assertQueue(QUEUES.ANALYTICS, { durable: true });
      await channel.assertQueue(QUEUES.NOTIFICATIONS, { durable: true });

      console.log('Queues declared:');
      console.log(`- ${QUEUES.USER_ACTIVITY}`);
      console.log(`- ${QUEUES.ORDER_PROCESSING}`);
      console.log(`- ${QUEUES.ANALYTICS}`);
      console.log(`- ${QUEUES.NOTIFICATIONS}`);

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

module.exports = { ...bakeryService };
