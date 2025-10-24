import jwt from "jsonwebtoken";
import type { SignOptions, JwtPayload } from "jsonwebtoken";
import { promisify } from "util";
import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { catchAsync } from "../utils/catchAsync";
import { userService } from "../services/userService";
import AppError from "../middlewares/appError";
import { sendEmail } from "../utils/email";
import { tokenService } from "../services/tokenService";
import { refreshTokenService } from "../services/refreshTokenService";
import { generateTempPassword } from "../utils/generatePassword";
import {
  SanitizedUser,
  CreateUserDto,
  UpdateUserDto,
  LoginCredentials,
  UserWithRoles,
} from "../types/user.types";
import { generateToken } from "../utils/token";

// Extend Express Request type
declare module "express-serve-static-core" {
  interface Request {
    user: UserWithRoles;
  }
}

// Environment variables validation
const jwtSecret = process.env.JWT_SECRET!;

const signToken = (id: string): string => {
  const payload: { id: string } = { id };
  // Cast the expiration time to a valid SignOptions value
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
  return jwt.sign(payload, jwtSecret, { expiresIn } as SignOptions);
};

const createSendToken = async (
  user: SanitizedUser,
  statusCode: number,
  res: Response
): Promise<void> => {
  const accessToken = signToken(user.id);
  const refreshToken = await refreshTokenService.createRefreshToken(user.id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  // Set access token cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 15 * 60 * 1000),
  });

  // Set refresh token cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.status(statusCode).json({
    status: "success",
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: 900,
      },
    },
  });
};

const createTokenAndSendEmail = async (user: SanitizedUser, req: Request) => {
  const setupToken = await userService.createSetupToken(user.id);

  // 5. Create the account setup URL
  const setupURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/setupAccount/${setupToken}`;

  // 6. Send welcome email with secure setup link
  const message = `
Hello ${user.username},

An administrator has created an account for you at Admin Service.

To set up your account, please click the following link:
${setupURL}

This link will expire in 24 hours for security reasons.

Important Security Notice:
- The setup link can only be used once
- If the link expires, contact an administrator for a new one

Best regards,
Your Admin Service Team
        `.trim();

  await sendEmail({
    email: user.email,
    subject: "Welcome to Admin Service - Account Setup Required",
    message,
  });
};

const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await userService.createUser(
      req.body.username,
      req.body.email,
      req.body.password
    );

    await createSendToken(newUser, 201, res);
  }
);

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: LoginCredentials = req.body;

    if (!email || !password)
      return next(new AppError("Please provide email and password", 400));

    const user: User | null = await userService.getUserByLogin(email, password);

    if (!user) return next(new AppError("Incorrect email or password", 401));

    const updatedUser = await userService.updateUserLastLogin(user.id);

    await createSendToken(updatedUser, 200, res);
  }
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1) Get tokens from header and cookies
      let accessToken =
        req.headers.authorization?.split(" ")[1] || req.cookies.accessToken;
      let refreshToken = req.cookies.refreshToken;

      // 2) Blacklist access token if exists and not expired
      if (accessToken) {
        const decoded = jwt.decode(accessToken) as JwtPayload;
        const expiresIn = decoded.exp
          ? decoded.exp - Math.floor(Date.now() / 1000)
          : 0;

        if (expiresIn > 0) {
          await tokenService.blacklistToken(accessToken, expiresIn);
        }
      }

      // 3) Revoke refresh token
      if (refreshToken) {
        const user = await refreshTokenService.validateRefreshToken(
          refreshToken
        );
        if (user) {
          await refreshTokenService.revokeRefreshToken(user.id);
        }
      }

      // 4) Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(200).json({
        status: "success",
        message: "Successfully logged out",
      });
    } catch (error) {
      // Even if operations fail, clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      next(new AppError("Error during logout. Please try again.", 500));
    }
  }
);

const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get access token from header or cookie
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token)
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );

    // 2) Check if token is blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted)
      return next(
        new AppError("Your session is invalid. Please log in again.", 401)
      );

    // 3) Verify token
    let decoded: JwtPayload & { id: string };
    try {
      decoded = await (promisify(jwt.verify) as any)(token, jwtSecret);
    } catch (error: any) {
      if (error.name === "TokenExpiredError")
        return next(
          new AppError("Your login has expired. Please log in again.", 401)
        );
      else if (error.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token. Please log in again.", 401));
      }
      return next(
        new AppError("Authentication failed. Please log in again.", 401)
      );
    }

    // 3) Check if user still exists
    const freshUser = await userService.getUserByIdWithCredentials(decoded.id);

    if (!freshUser)
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );

    if (
      decoded.iat &&
      (await userService.changedPasswordAfter(
        freshUser.password_changed_at,
        decoded.iat
      ))
    )
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401
        )
      );

    req.user = freshUser;
    next();
  }
);

const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user.roles?.map((r) => r.role.name);
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.some((r) => userRoles.includes(r))) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.passwordCurrent || !req.body.password)
      return next(
        new AppError("Please provide your current and new password", 400)
      );

    if (
      !(await userService.correctPassword(
        req.body.passwordCurrent,
        req.user.password
      ))
    )
      return next(new AppError("Your current password is wrong.", 401));

    if (req.body.password === req.body.passwordCurrent)
      return next(
        new AppError(
          "Your new password is identical to the current one. Try a new password",
          400
        )
      );

    const updatedUser: SanitizedUser = await userService.updateUserPassword(
      req.user.id,
      req.body.password
    );

    await createSendToken(updatedUser, 200, res);
  }
);

const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body.email)
      return next(new AppError("Please provide your email address", 400));

    const user = await userService.getUserByEmail(req.body.email);

    if (!user)
      return next(
        new AppError("There is no user with that email address", 404)
      );

    const resetToken = await userService.createPasswordResetToken(user.id);
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn\'t forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Your password reset token (valid for 10 min)",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "Token sent to email!",
      });
    } catch (err) {
      await userService.updateUserPasswordResetToken(user.id, null, null);

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  }
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await userService.getUserByResetToken(req.params.token);

    if (!user)
      return next(new AppError("Token is invalid or has expired", 400));
    if (!req.body.password)
      return next(new AppError("Please provide a new password", 400));
    if (!req.body.passwordConfirm)
      return next(new AppError("Please confirm your password", 400));
    if (req.body.password !== req.body.passwordConfirm)
      return next(
        new AppError("Password and password confirmation do not match", 400)
      );

    const updatedUser = await userService.resetUserPassword(
      user.id,
      req.body.password
    );

    await createSendToken(updatedUser, 200, res);
  }
);

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Check if the creator is an admin
    // if (!req.user || req.user.role !== "admin") {
    //   return next(
    //     new AppError("You do not have permission to perform this action", 403)
    //   );
    // }

    const { username, email } = req.body;

    if (!username) return next(new AppError("Please provide a username", 400));
    if (!email)
      return next(new AppError("Please provide your email address", 400));

    try {
      // 2. Generate a secure temporary password
      const tempPassword = generateTempPassword();

      // 3. Create user with temporary password and force_password_change flag
      const newUser = await userService.createUser(
        username,
        email,
        tempPassword
      );

      // 4. Generate a secure setup token that expires in 24 hours
      createTokenAndSendEmail(newUser, req);

      // 5. Send success response (without sending the temporary password)
      res.status(201).json({
        status: "success",
        message:
          "Account created successfully. Setup instructions sent to user's email.",
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
          },
        },
      });
    } catch (err) {
      return next(
        new AppError("Error creating account. Please try again later.", 500)
      );
    }
  }
);

const setupUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Verify the setup token and get user
    const user = await userService.getUserBySetupToken(req.params.token);

    if (!user)
      return next(
        new AppError(
          "This link has expired or is invalid. Please contact an administrator for a new one.",
          400
        )
      );

    const { email } = req.body.email;

    if (!email)
      return next(new AppError("Please provide your email address", 400));

    // 2. Check if this is the correct user setting up their account
    if (user.email !== req.body.email)
      return next(
        new AppError("The email address doesn't match the setup link.", 400)
      );

    // 3. Validate the new password
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm)
      return next(
        new AppError("Please provide a new password and confirm it", 400)
      );

    if (password !== passwordConfirm)
      return next(
        new AppError("Password and password confirmation do not match", 400)
      );

    // 4. Additional password validation (you might want to add more rules)
    // if (password.length < 8) {
    //   return next(
    //     new AppError("Password must be at least 8 characters long", 400)
    //   );
    // }

    try {
      // 5. Update user's password and clear setup token
      const updatedUser = await userService.completeUserSetup(
        user.id,
        password
      );

      // 6. Send confirmation email
      await sendEmail({
        email: user.email,
        subject: "Account Setup Completed",
        message: `
Hello ${user.username},

Your account has been successfully set up. You can now log in with your email and new password.

If you didn't perform this action, please contact an administrator immediately.

Best regards,
Your Admin Service Team
          `.trim(),
      });

      // 7. Send success response and create session
      await createSendToken(updatedUser, 200, res);
    } catch (err) {
      return next(
        new AppError(
          "Error completing account setup. Please try again later.",
          500
        )
      );
    }
  }
);

const regenerateSetupToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email)
      return next(
        new AppError("Please provide your email address address", 400)
      );

    try {
      const user = await userService.getUserByEmail(email);

      if (!user) {
        return next(new AppError("No user found with that ID", 404));
      }

      // 4. Generate a secure setup token that expires in 24 hours
      createTokenAndSendEmail(user, req);

      // 5. Send success response (without sending the temporary password)
      res.status(200).json({
        status: "success",
        message:
          "Token regenerated successfully. Setup instructions sent to user's email.",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        },
      });
    } catch (err) {
      return next(
        new AppError("Error regenerating token. Please try again later.", 500)
      );
    }
  }
);

const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get refresh token from body or cookie
    let refreshToken = req.body.refresh_token || req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AppError("Refresh token is required", 400));
    }

    // Rotate the refresh token (invalidate old, create new)
    const result = await refreshTokenService.rotateRefreshToken(refreshToken);

    if (!result) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }

    // Get fresh user data
    const freshUser = await userService.getUserById(result.userId);
    if (!freshUser) {
      return next(new AppError("User no longer exists", 401));
    }

    // Generate new tokens
    await createSendToken(freshUser, 200, res);
  }
);

export const authController = {
  signup,
  login,
  logout,
  protect,
  restrictTo,
  updatePassword,
  forgotPassword,
  resetPassword,
  createUser,
  setupUser,
  regenerateSetupToken,
  refreshToken,
};
