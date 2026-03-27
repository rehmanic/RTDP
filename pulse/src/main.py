import json
import os
import queue
import random
import threading
import time
from datetime import datetime, timezone
import redis

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
CHANNEL = "weather-updates"
CITIES = ["New York", "London", "Tokyo", "Paris", "Sydney", "Dubai", "Toronto", "Berlin", "Mumbai", "Seoul", "Islamabad", "Lahore", "Karachi", "Peshawar"]
log_queue = queue.Queue()


def publisher(client):
    while True:
        city = random.choice(CITIES)
        data = json.dumps({
            "city": city,
            "temperature": round(random.uniform(-10, 45), 1),
            "humidity": round(random.uniform(10, 100), 1),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        client.publish(CHANNEL, data)
        log_queue.put(f"Published data for {city}")
        time.sleep(5)


def logger():
    while True:
        msg = log_queue.get()
        print(f"[LOG] - {msg}")


if __name__ == "__main__":
    client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    try:
        client.ping()
        print(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
    except redis.ConnectionError:
        print(f"Waiting for Redis at {REDIS_HOST}:{REDIS_PORT}...")

    try:
        pub_thread = threading.Thread(target=publisher, args=(client,), daemon=True)
        log_thread = threading.Thread(target=logger, daemon=True)
        
        pub_thread.start()
        log_thread.start()
        
        print(f"Pulse running — publishing to '{CHANNEL}' every 5s")

        pub_thread.join()
    except Exception as e:
        print(f"Failed to start threads: {e}")
