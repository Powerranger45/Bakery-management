// src/workers/orderWorker.js
const amqp = require('amqplib');
const prisma = require('../utils/prisma');
require('dotenv').config();

const MAX_RETRIES = 15; // Consistent with bakeryService
const RETRY_DELAY_MS = 5000; // Consistent with bakeryService

// Define all queue names as constants to ensure consistency
const QUEUES = {
  USER_ACTIVITY: 'user-activity',
  ORDER_PROCESSING: 'order-processing',
  ANALYTICS: 'analytics-stream',
  NOTIFICATIONS: 'notifications-stream'
};

// Order processing logic
async function processOrder(orderId, channel) {
  console.log(`Processing order ${orderId}...`);

  try {
    // Update order status to PROCESSING
    await prisma.order.update({
      where: { id: Number(orderId) }, // Ensure orderId is a number
      data: { status: 'PROCESSING' },
    });

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Publish to all relevant queues
    if (channel) {
      // User activity queue
      channel.sendToQueue(
        QUEUES.USER_ACTIVITY,
        Buffer.from(
          JSON.stringify({
            orderId: order.id,
            userId: order.userId,
            action: 'order_status_changed',
            status: 'PROCESSING',
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );

      // Analytics stream
      channel.sendToQueue(
        QUEUES.ANALYTICS,
        Buffer.from(
          JSON.stringify({
            type: 'order_status',
            orderId: order.id,
            userId: order.userId,
            status: 'PROCESSING',
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );

      // Notifications stream
      channel.sendToQueue(
        QUEUES.NOTIFICATIONS,
        Buffer.from(
          JSON.stringify({
            type: 'order_update',
            orderId: order.id,
            userId: order.userId,
            message: `Your order #${order.id} is now being processed`,
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );
    }

    // Simulate order processing time
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update order status to COMPLETED
    await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status: 'COMPLETED' },
    });

    // Publish completion events to all queues
    if (channel) {
      // User activity queue
      channel.sendToQueue(
        QUEUES.USER_ACTIVITY,
        Buffer.from(
          JSON.stringify({
            orderId: order.id,
            userId: order.userId,
            action: 'order_status_changed',
            status: 'COMPLETED',
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );

      // Analytics stream
      channel.sendToQueue(
        QUEUES.ANALYTICS,
        Buffer.from(
          JSON.stringify({
            type: 'order_status',
            orderId: order.id,
            userId: order.userId,
            status: 'COMPLETED',
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );

      // Notifications stream
      channel.sendToQueue(
        QUEUES.NOTIFICATIONS,
        Buffer.from(
          JSON.stringify({
            type: 'order_update',
            orderId: order.id,
            userId: order.userId,
            message: `Your order #${order.id} has been completed`,
            timestamp: new Date(),
          })
        ),
        { persistent: true }
      );
    }

    console.log(`Order ${orderId} processed successfully`);
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);

    // Attempt to update order status to FAILED on error
    try {
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: { status: 'FAILED' },
      });

      // Publish failure events
      if (channel) {
        const order = await prisma.order.findUnique({
          where: { id: Number(orderId) }
        });

        if (order) {
          // User activity queue
          channel.sendToQueue(
            QUEUES.USER_ACTIVITY,
            Buffer.from(
              JSON.stringify({
                orderId: order.id,
                userId: order.userId,
                action: 'order_status_changed',
                status: 'FAILED',
                error: error.message,
                timestamp: new Date(),
              })
            ),
            { persistent: true }
          );

          // Analytics stream
          channel.sendToQueue(
            QUEUES.ANALYTICS,
            Buffer.from(
              JSON.stringify({
                type: 'order_status',
                orderId: order.id,
                userId: order.userId,
                status: 'FAILED',
                error: error.message,
                timestamp: new Date(),
              })
            ),
            { persistent: true }
          );

          // Notifications stream
          channel.sendToQueue(
            QUEUES.NOTIFICATIONS,
            Buffer.from(
              JSON.stringify({
                type: 'order_update',
                orderId: order.id,
                userId: order.userId,
                message: `There was an issue with your order #${order.id}`,
                timestamp: new Date(),
              })
            ),
            { persistent: true }
          );
        }
      }
    } catch (updateError) {
      console.error(`Error updating order ${orderId} status to FAILED:`, updateError);
    }
  }
}

// Retry logic for RabbitMQ connection - using same approach as bakeryService
async function connectWithRetry() {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`Worker connecting to RabbitMQ... Attempt ${retries + 1}`);
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      console.log('Worker connected to RabbitMQ successfully');
      return connection;
    } catch (error) {
      console.error(`Worker connection failed: ${error.message}`);
      retries++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error('Worker failed to connect to RabbitMQ after multiple attempts.');
}

// Worker to listen for queues and process messages
async function startWorker() {
  try {
    // Establish RabbitMQ connection with retry logic
    const connection = await connectWithRetry();
    const channel = await connection.createChannel();

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

    // Order processing queue
    channel.prefetch(1); // Process one message at a time
    console.log('Worker ready to process orders...');
    channel.consume(QUEUES.ORDER_PROCESSING, async (msg) => {
      if (msg) {
        try {
          const { orderId } = JSON.parse(msg.content.toString());
          console.log(`Received order processing request for orderId: ${orderId}`);
          await processOrder(orderId, channel);
          channel.ack(msg); // Acknowledge successful processing
        } catch (error) {
          console.error('Error processing order message:', error);
          // Only requeue if it's not a data validation error
          const shouldRequeue = !error.message.includes('not found') &&
                               !error.message.includes('validation');
          channel.reject(msg, shouldRequeue);
        }
      }
    });

    // User activity queue for logging/analytics
    console.log('Worker ready to log user activity...');
    channel.consume(QUEUES.USER_ACTIVITY, (msg) => {
      if (msg) {
        try {
          const activity = JSON.parse(msg.content.toString());
          console.log(`User Activity: ${activity.action} by user ${activity.userId} at ${activity.timestamp}`);
          // Here you could store activity logs in a database if needed
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing user activity message:', error);
          channel.reject(msg, false); // Don't requeue parsing errors
        }
      }
    });

    // Analytics stream
    console.log('Worker ready to process analytics data...');
    channel.consume(QUEUES.ANALYTICS, (msg) => {
      if (msg) {
        try {
          const analyticsData = JSON.parse(msg.content.toString());
          console.log(`Analytics Event: ${analyticsData.type} at ${analyticsData.timestamp}`);
          // Here you could process and store analytics data
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing analytics message:', error);
          channel.reject(msg, false);
        }
      }
    });

    // Notifications stream
    console.log('Worker ready to send notifications...');
    channel.consume(QUEUES.NOTIFICATIONS, (msg) => {
      if (msg) {
        try {
          const notification = JSON.parse(msg.content.toString());
          console.log(`Notification: ${notification.message} for user ${notification.userId}`);
          // Here you could send actual notifications (email, push, etc)
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing notification message:', error);
          channel.reject(msg, false);
        }
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Gracefully shutting down worker...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Worker failed to start:', error.message);
    process.exit(1);
  }
}

// Start the worker process
startWorker().catch(error => {
  console.error('Fatal error in worker:', error);
  process.exit(1);
});
