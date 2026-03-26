// @ts-nocheck
import dotenv from "dotenv";
import { createServer, Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import Redis from "ioredis";

dotenv.config();

const getConfig = () => ({
  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  port: Number(process.env.BACKEND_PORT ?? 3001),
  channel: "weather-updates",
});

const initSocketServer = (): { httpServer: HttpServer; io: SocketIOServer } => {
  const httpServer = createServer();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return { httpServer, io };
};

const initRedisSubscriber = (
  host: string,
  port: number,
  channel: string,
  io: SocketIOServer
): Redis => {
  const subscriber = new Redis({ host, port });

  subscriber.on("connect", () => {
    console.log(`Connected to Redis at ${host}:${port}`);
  });

  subscriber.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  subscriber.subscribe(channel, (err, count) => {
    if (err) {
      console.error(`Failed to subscribe to '${channel}':`, err.message);
      process.exit(1);
    }
    console.log(`Subscribed to '${channel}' (${count} channel(s))`);
  });

  subscriber.on("message", (ch, message) => {
    if (ch === channel) {
      try {
        const data = JSON.parse(message);
        io.emit("weather-update", data);
      } catch {
        console.error("Invalid JSON received:", message);
      }
    }
  });

  return subscriber;
};

const setupGracefulShutdown = (
  subscriber: Redis,
  io: SocketIOServer,
  httpServer: HttpServer
) => {
  const shutdown = () => {
    console.log("\nShutting down Relay…");
    subscriber.disconnect();
    io.close();
    httpServer.close(() => {
      console.log("Relay stopped.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

const start = () => {
  const config = getConfig();

  const { httpServer, io } = initSocketServer();
  
  const subscriber = initRedisSubscriber(
    config.redisHost,
    config.redisPort,
    config.channel,
    io
  );

  setupGracefulShutdown(subscriber, io, httpServer);

  httpServer.listen(config.port, () => {
    console.log(`Relay is running on port ${config.port}`);
  });
};

start();
