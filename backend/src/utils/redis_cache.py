import redis
import json
import os
from datetime import timedelta

# Get Redis connection parameters from environment variables
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))

# Create Redis client
redis_client = redis.Redis(
    host=redis_host,
    port=redis_port,
    decode_responses=True  # Automatically decode responses to strings
)

def get_cache(key):
    """
    Retrieve a value from Redis cache.
    """
    try:
        data = redis_client.get(key)
        if data is not None:
            return json.loads(data)  # Deserialize JSON string to Python object
        return None
    except Exception as e:
        print(f"Redis get error: {e}")
        return None

def set_cache(key, value, expire_time=timedelta(minutes=30)):
    """
    Store a value in Redis cache with an optional expiration time.
    """
    try:
        serialized_value = json.dumps(value)  # Serialize Python object to JSON string
        redis_client.set(key, serialized_value, ex=int(expire_time.total_seconds()))
        return True
    except Exception as e:
        print(f"Redis set error: {e}")
        return False

def delete_cache(key):
    """
    Delete a key from Redis cache.
    """
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        print(f"Redis delete error: {e}")
        return False
