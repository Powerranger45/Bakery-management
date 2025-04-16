import pika
from src.config import settings  # Import the settings object

RABBITMQ_DEFAULT_EXCHANGE = ""  # Default exchange
RABBITMQ_DEFAULT_ROUTING_KEY = "default_queue"  # A default queue name

def get_rabbitmq_parameters():
    """Parses the RabbitMQ URL and returns connection parameters."""
    if not settings.RABBITMQ_URL:
        raise ValueError("RABBITMQ_URL not configured in environment.")
    return pika.URLParameters(settings.RABBITMQ_URL)

if __name__ == '__main__':
    try:
        params = get_rabbitmq_parameters()
        print(f"RabbitMQ Connection Parameters: {params}")
    except ValueError as e:
        print(f"Error: {e}")
