import pika
from .rabbitmq_config import get_rabbitmq_parameters

def callback(ch, method, properties, body):
    """Callback function to handle received messages."""
    print(f" [x] Received {body.decode()} from {method.routing_key}")
    ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge message

def start_consuming(queue_name):
    """Starts consuming messages from the specified queue."""
    try:
        parameters = get_rabbitmq_parameters()
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        channel.queue_declare(queue=queue_name, durable=True)
        channel.basic_qos(prefetch_count=1)  # Process one message at a time
        channel.basic_consume(queue=queue_name, on_message_callback=callback)

        print(f" [*] Waiting for messages in {queue_name}. To exit press CTRL+C")
        channel.start_consuming()
    except pika.exceptions.AMQPConnectionError as e:
        print(f"Error connecting to RabbitMQ: {e}")
    except ValueError as e:
        print(f"Configuration Error: {e}")

if __name__ == '__main__':
    start_consuming("default_queue")  # Consume from the default queue
