import { UserWithRole, SanitizedUserWithRole } from "../types/user.types";

export const sanitizeUser = (user: UserWithRole): SanitizedUserWithRole => {
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
  };
};
