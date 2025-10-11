import Redis from "ioredis";

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
  throw new Error("Redis configuration missing in environment variables");
}

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    // Maximum wait time: 3s
    return Math.min(times * 50, 3000);
  },
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis");
});

export default redis;
