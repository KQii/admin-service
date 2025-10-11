import redis from "../config/redis";

export const tokenService = {
  /**
   * Add a token to the blacklist
   * @param token The JWT token to blacklist
   * @param expiresIn Time in seconds until the token expires
   */
  blacklistToken: async (token: string, expiresIn: number): Promise<void> => {
    try {
      await redis.set(`bl_${token}`, "true", "EX", expiresIn);
    } catch (error) {
      console.error("Error blacklisting token:", error);
      throw new Error("Failed to blacklist token");
    }
  },

  /**
   * Check if a token is blacklisted
   * @param token The JWT token to check
   * @returns boolean indicating if token is blacklisted
   */
  isTokenBlacklisted: async (token: string): Promise<boolean> => {
    try {
      const result = await redis.get(`bl_${token}`);
      return result === "true";
    } catch (error) {
      console.error("Error checking blacklisted token:", error);
      // If Redis is down, treat token as blacklisted for security
      return true;
    }
  },

  /**
   * Remove a token from the blacklist
   * @param token The JWT token to remove from blacklist
   */
  removeFromBlacklist: async (token: string): Promise<void> => {
    try {
      await redis.del(`bl_${token}`);
    } catch (error) {
      console.error("Error removing token from blacklist:", error);
      throw new Error("Failed to remove token from blacklist");
    }
  },
};
