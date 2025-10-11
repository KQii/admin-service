import bcrypt from "bcryptjs";
import { userModel } from "../models/userModel";
import { User } from "@prisma/client";
import { sanitizeUser, sanitizeUserWithRoles } from "../utils/dataTransformers";
import { QueryResult } from "../utils/apiFeatures";
import {
  SanitizedUser,
  UserWithRoles,
  SanitizedUserWithRoles,
} from "../types/user.types";
import { generateToken, hashedToken } from "../utils/token";

export const userService = {
  correctPassword: async (candidatePassword: string, password: string) => {
    return await bcrypt.compare(candidatePassword, password);
  },

  createPasswordResetToken: async (id: string) => {
    const resetToken = generateToken();
    const passwordResetToken = hashedToken(resetToken);

    const user = await userService.updateUserPasswordResetToken(
      id,
      passwordResetToken,
      new Date(Date.now() + 10 * 60 * 1000)
    );

    return resetToken;
  },

  createSetupToken: async (id: string) => {
    const setupToken = generateToken();
    const hashedSetupToken = hashedToken(setupToken);

    // Setup tokens can be valid longer than password reset tokens (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await userModel.updateSetupToken(id, hashedSetupToken, expiresAt);

    return setupToken;
  },

  changedPasswordAfter: async (
    passwordChangedAt: Date | null,
    JWTTimestamp: number
  ) => {
    if (passwordChangedAt) {
      const changedTimestamp = Math.floor(passwordChangedAt.getTime() / 1000);

      return JWTTimestamp < changedTimestamp;
    }

    return false;
  },

  getAllUsers: async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10
  ): Promise<QueryResult<SanitizedUserWithRoles>> => {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      userModel.findAll(filters, skip, limit),
      userModel.count(filters),
    ]);

    return {
      data: users.map((user) => sanitizeUserWithRoles(user as UserWithRoles)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  },

  getUserByLogin: async (email: string, candidatePassword: string) => {
    const user: User | null = await userModel.findByEmail(email);

    if (
      !user ||
      !(await userService.correctPassword(candidatePassword, user.password))
    ) {
      return null;
    }
    return user;
  },
  getUserById: async (id: string): Promise<SanitizedUserWithRoles | null> => {
    const user: UserWithRoles | null = await userModel.findById(id);
    if (!user) return null;
    return sanitizeUserWithRoles(user);
  },

  // This method returns the complete user data including sensitive information
  // Use this method only for internal operations like authentication
  getUserByIdWithCredentials: async (id: string) => {
    const user: User | null = await userModel.findById(id);
    return user as UserWithRoles;
  },

  getUserByEmail: async (email: string) => {
    const user: User | null = await userModel.findByEmail(email);
    if (!user) return null;
    else return user;
  },

  getUserByUsername: async (username: string) => {
    const user: User | null = await userModel.findByUsername(username);
    if (!user) return null;
    else return user;
  },

  authenticateUser: async (email: string, password: string) => {
    // Try to find user by email first, then by email
    let user: User | null = await userModel.findByEmail(email);

    if (
      !user ||
      !(await userService.correctPassword(password, user.password))
    ) {
      return null;
    }

    return user;
  },

  getUserByResetToken: async (token: string) => {
    const resetToken = hashedToken(token);
    const user = await userModel.findByResetToken(resetToken);

    return user;
  },

  getUserBySetupToken: async (token: string) => {
    const setupToken = hashedToken(token);
    const user = await userModel.findBySetupToken(setupToken);

    return user;
  },

  createUser: async (
    username: string,
    email: string,
    password: string
  ): Promise<SanitizedUser> => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await userModel.createUser(username, email, hashedPassword);

    return sanitizeUser(user);
  },

  updateUserLastLogin: async (id: string) => {
    const user = await userModel.updateLastLogin(id);
    return sanitizeUser(user);
  },

  updateUserPassword: async (id: string, password: string) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedUser = await userModel.updatePassword(id, hashedPassword);

    return sanitizeUser(updatedUser);
  },

  updateUserPasswordResetToken: async (
    id: string,
    token: string | null,
    expiresAt: Date | null
  ) => {
    const user = await userModel.updatePasswordResetToken(id, token, expiresAt);
    return user;
  },

  resetUserPassword: async (id: string, password: string) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedUser = await userModel.updatePasswordInfo(id, hashedPassword);

    return updatedUser;
  },

  completeUserSetup: async (
    id: string,
    password: string
  ): Promise<SanitizedUser> => {
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password, clear setup token, and mark setup as complete
    const updatedUser = await userModel.completeSetup(id, hashedPassword);

    return sanitizeUser(updatedUser);
  },
};
