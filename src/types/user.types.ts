import { User } from "@prisma/client";

/**
 * Represents a user object with sensitive information removed
 * Used when sending user data in responses
 */
export type SanitizedUser = Omit<
  User,
  | "password"
  | "password_changed_at"
  | "password_reset_token"
  | "password_reset_expires"
  | "setup_token"
  | "setup_expires"
  | "refresh_token"
  | "refresh_token_expires"
>;

/**
 * Required fields when creating a new user
 */
export type CreateUserDto = {
  username: string;
  email: string;
  password: string;
};

/**
 * Fields that can be updated for a user
 */
export type UpdateUserDto = Partial<Omit<User, "id" | "password">>;

/**
 * Login credentials
 */
export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * User with role information included
 */
export interface UserWithRole extends User {
  role: {
    id: string;
    name: string;
    description: string;
  };
}

/**
 * Sanitized user with roles included
 */
export interface SanitizedUserWithRole extends SanitizedUser {
  role: {
    id: string;
    name: string;
    description: string;
  };
}
