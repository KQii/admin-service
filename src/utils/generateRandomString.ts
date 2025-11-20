import crypto from "crypto";

/**
 * Generates a cryptographically secure string
 * @returns A random string
 */
export const generateRandomString = (
  size: number = 32,
  scheme: BufferEncoding = "hex"
): string => {
  const randomBytes = crypto.randomBytes(size);
  return randomBytes.toString(scheme);
};
