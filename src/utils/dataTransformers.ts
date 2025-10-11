import { User } from "@prisma/client";
import { UserWithRoles, SanitizedUserWithRoles } from "../types/user.types";

export const sanitizeUser = (user: User) => {
  const {
    password,
    password_changed_at,
    password_reset_token,
    password_reset_expires,
    setup_token,
    setup_expires,
    refresh_token,
    refresh_token_expires,
    ...userWithoutPassword
  } = user;
  return userWithoutPassword;
};

export const sanitizeUserWithRoles = (
  user: UserWithRoles
): SanitizedUserWithRoles => {
  const {
    password,
    password_changed_at,
    password_reset_token,
    password_reset_expires,
    setup_token,
    setup_expires,
    refresh_token,
    refresh_token_expires,
    ...userWithoutPassword
  } = user;

  return {
    ...userWithoutPassword,
    roles: user.roles?.map((ur) => ur.role) || [],
  };
};
