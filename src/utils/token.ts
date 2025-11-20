import crypto from "crypto";

export const hashedToken = (token: string): string => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return hashedToken;
};
