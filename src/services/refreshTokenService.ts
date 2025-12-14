import crypto from "crypto";
import { userModel } from "../models/userModel";
import { parseTimeToSeconds } from "../utils/timeParser";
import { generateRandomString as generateRefreshToken } from "../utils/generateRandomString";

export const refreshTokenService = {
  createRefreshToken: async (userId: string): Promise<string> => {
    const refreshToken = generateRefreshToken(64, "hex");

    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
    const expiresInMiliseconds = parseTimeToSeconds(expiresIn) * 1000;
    const expiresAt = new Date(Date.now() + expiresInMiliseconds);

    await userModel.updateRefreshToken(userId, refreshToken, expiresAt);
    return refreshToken;
  },

  validateRefreshToken: async (refreshToken: string) => {
    const user = await userModel.findByRefreshToken(refreshToken);
    console.log("User from findByRefreshToken", user);

    if (
      !user ||
      !user.refresh_token_expires ||
      user.refresh_token_expires < new Date()
    ) {
      return null;
    }

    return user;
  },

  revokeRefreshToken: async (userId: string): Promise<void> => {
    await userModel.updateRefreshToken(userId, null, null);
  },

  rotateRefreshToken: async (
    oldRefreshToken: string
  ): Promise<{ userId: string; newRefreshToken: string } | null> => {
    const user = await refreshTokenService.validateRefreshToken(
      oldRefreshToken
    );

    if (!user) {
      return null;
    }

    const newRefreshToken = await refreshTokenService.createRefreshToken(
      user.id
    );

    return {
      userId: user.id,
      newRefreshToken,
    };
  },
};
