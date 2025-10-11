import redis from "../config/redis";
import { AuthCode } from "../types/oAuth2.types";

export const authCodeService = {
  // Store auth code with TTL (Time To Live)
  storeAuthCode: async (code: string, data: AuthCode): Promise<void> => {
    const key = `auth_code:${code}`;
    const ttl = 600; // 10 minutes in seconds

    await redis.setex(key, ttl, JSON.stringify(data));
  },

  // Get and delete auth code (one-time use)
  consumeAuthCode: async (code: string): Promise<AuthCode | null> => {
    const key = `auth_code:${code}`;

    // Get the data
    const data = await redis.get(key);
    if (!data) return null;

    // Delete immediately (one-time use)
    await redis.del(key);

    return JSON.parse(data);
  },

  // Check if code exists (without consuming)
  checkAuthCode: async (code: string): Promise<boolean> => {
    const key = `auth_code:${code}`;
    const exists = await redis.exists(key);
    return exists === 1;
  },

  deleteAuthCode: async (code: string): Promise<void> => {
    const key = `auth_code:${code}`;
    await redis.del(key);
  },
};
