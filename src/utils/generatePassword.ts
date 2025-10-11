import crypto from "crypto";

/**
 * Generates a cryptographically secure temporary password
 * @returns A random password string
 */
export const generateTempPassword = (): string => {
  // Generate 12 random bytes and convert to base64
  const randomBytes = crypto.randomBytes(12);
  return randomBytes.toString("base64");
};
