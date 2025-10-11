import crypto from "crypto";

export const generateToken = (size: number = 32): string => {
  const token = crypto.randomBytes(size).toString("hex");
  return token;
};

export const hashedToken = (token: string): string => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return hashedToken;
};
