// src/workers/orderWorker.js
const amqp = require('amqplib');
const prisma = require('../utils/prisma');
require('dotenv').config();

const MAX_RETRIES = 15; // Consistent with bakeryService
const RETRY_DELAY_MS = 5000; // Consistent with bakeryService

// Order processing logic
async function processOrder(orderId) {
  console.log(`Processing order ${orderId}...`);

  try {
    // Update order status to PROCESSING
    await prisma.order.update({
      where: { id: Number(orderId) }, // Ensure orderId is a number
      data: { status: 'PROCESSING' },
    });

    // Simulate order processing time
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update order status to COMPLETED
    await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status: 'COMPLETED' },
    });

    console.log(`Order ${orderId} processed successfully`);
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);

    // Attempt to update order status to FAILED on error
    try {
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: { status: 'FAILED' },
      });
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

    // Declare durable queues - same as in bakeryService
    await channel.assertQueue('user-activity', { durable: true });
    await channel.assertQueue('order-processing', { durable: true });

    // Order processing queue
    channel.prefetch(1); // Process one message at a time
    console.log('Worker ready to process orders...');
    channel.consume('order-processing', async (msg) => {
      if (msg) {
        try {
          const { orderId } = JSON.parse(msg.content.toString());
          console.log(`Received order processing request for orderId: ${orderId}`);
          await processOrder(orderId);
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
    channel.consume('user-activity', (msg) => {
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