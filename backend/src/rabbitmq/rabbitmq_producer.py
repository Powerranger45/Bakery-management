# backend/src/rabbitmq/rabbitmq_producer.py

import pika
from .rabbitmq_config import RABBITMQ_DEFAULT_EXCHANGE, get_rabbitmq_parameters

def publish_message(routing_key, message):
    """Publishes a message to RabbitMQ."""
    try:
        parameters = get_rabbitmq_parameters()
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        channel.queue_declare(queue=routing_key, durable=True)  # Ensure queue exists

        channel.basic_publish(
            exchange=RABBITMQ_DEFAULT_EXCHANGE,
            routing_key=routing_key,
            body=message.encode('utf-8'),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
            )
        )
        print(f" [x] Sent '{message}' to {routing_key}")
    except pika.exceptions.AMQPConnectionError as e:
        print(f"Error connecting to RabbitMQ: {e}")
    except ValueError as e:
        print(f"Configuration Error: {e}")
    finally:
        if 'connection' in locals() and connection.is_open:
            connection.close()

if __name__ == '__main__':
    # Example usage:
    publish_message("logs", "This is a log message from env config.")
    publish_message("user_actions", "User logged in successfully.")
