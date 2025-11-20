import bcrypt from "bcryptjs";
import { userModel } from "../models/userModel";
import { User } from "@prisma/client";
import { sanitizeUser } from "../utils/dataTransformers";
import { PrismaQueryBuilder } from "../utils/prismaQueryBuilder";
import {
  UserWithRole,
  SanitizedUserWithRole,
  UpdateUserDto,
} from "../types/user.types";
import { hashedToken } from "../utils/token";
import { generateRandomString as generateToken } from "../utils/generateRandomString";
import { roleModel } from "../models/roleModel";

export const userService = {
  correctPassword: async (candidatePassword: string, password: string) => {
    return await bcrypt.compare(candidatePassword, password);
  },

  createPasswordResetToken: async (id: string) => {
    const resetToken = generateToken(32, "hex");
    const passwordResetToken = hashedToken(resetToken);

    const user = await userService.updateUserPasswordResetToken(
      id,
      passwordResetToken,
      new Date(Date.now() + 10 * 60 * 1000)
    );

    return resetToken;
  },

  createSetupToken: async (id: string) => {
    const setupToken = generateToken(32, "hex");
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

  getAllUsers: async (queryString: any): Promise<any> => {
    const queryBuilder = new PrismaQueryBuilder(queryString);

    // Build the Prisma query
    queryBuilder.filter().sort().limitFields().paginate();

    const prismaQuery = queryBuilder.getQuery();
    const { page, limit } = queryBuilder.getPaginationParams();

    // Execute query with Prisma
    const users = await userModel.findManyWithQuery(prismaQuery);

    // Sanitize users to remove sensitive information
    // Only sanitize if users have the complete structure (with role)
    const sanitizedUsers = users.map((user: any) => {
      // If user has the complete structure, sanitize it
      if (user.role) {
        return sanitizeUser(user as UserWithRole);
      }
      // If using field selection, just remove sensitive fields manually
      const {
        password,
        password_changed_at,
        password_reset_token,
        password_reset_expires,
        setup_token,
        setup_expires,
        refresh_token,
        refresh_token_expires,
        ...safeUser
      } = user;
      return safeUser;
    });

    // Get total count for pagination (with same filters)
    const total = await userModel.count(prismaQuery.where);
    const totalPages = Math.ceil(total / limit);

    return {
      users: sanitizedUsers,
      metadata: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  getUserById: async (id: string): Promise<SanitizedUserWithRole | null> => {
    const user: UserWithRole | null = await userModel.findById(id);
    if (!user) return null;
    return sanitizeUser(user);
  },

  // This method returns the complete user data including sensitive information
  // Use this method only for internal operations like authentication
  getUserByIdWithCredentials: async (id: string) => {
    const user: UserWithRole | null = await userModel.findById(id);
    return user as UserWithRole;
  },

  getUserByEmail: async (email: string) => {
    const user: UserWithRole | null = await userModel.findByEmail(email);
    if (!user) return null;
    else return user;
  },

  getUserByUsername: async (username: string) => {
    const user: UserWithRole | null = await userModel.findByUsername(username);
    if (!user) return null;
    else return user;
  },

  authenticateUser: async (email: string, password: string) => {
    // Try to find user by email first, then by email
    let user: UserWithRole | null = await userModel.findByEmail(email);

    if (
      !user ||
      !(await userService.correctPassword(password, user.password))
    ) {
      return null;
    }

    return sanitizeUser(user);
  },

  getUserByResetToken: async (token: string) => {
    const resetToken = hashedToken(token);
    const user = await userModel.findByResetToken(resetToken);

    return user;
  },

  getUserBySetupToken: async (token: string) => {
    const setupToken = hashedToken(token);
    console.log(setupToken);
    const user: UserWithRole | null = await userModel.findBySetupToken(
      setupToken
    );

    if (!user) return null;

    return sanitizeUser(user);
  },

  createUser: async (
    username: string,
    email: string,
    password: string
  ): Promise<SanitizedUserWithRole> => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const defaultRole = await roleModel.findByName("operator");

    const user = await userModel.createUser(
      username,
      email,
      hashedPassword,
      defaultRole?.id!
    );

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

    return sanitizeUser(updatedUser);
  },

  completeUserSetup: async (
    id: string,
    password: string
  ): Promise<SanitizedUserWithRole> => {
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password, clear setup token, and mark setup as complete
    const updatedUser = await userModel.completeSetup(id, hashedPassword);

    return sanitizeUser(updatedUser);
  },

  updateUserByIsActive: async (
    id: string,
    user: UpdateUserDto
  ): Promise<SanitizedUserWithRole> => {
    const updatedUser = await userModel.updateIsActive(id, user.is_active!);
    return sanitizeUser(updatedUser);
  },

  updateUserByRoleId: async (
    id: string,
    user: UpdateUserDto
  ): Promise<SanitizedUserWithRole> => {
    const updatedUser = await userModel.updateRoleId(id, user.roleId!);
    return sanitizeUser(updatedUser);
  },

  deleteUser: async (id: string): Promise<void> => {
    await userModel.deleteUser(id);
  },
};
