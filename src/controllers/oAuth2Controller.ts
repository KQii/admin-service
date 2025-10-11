import { Request, Response, NextFunction } from "express";
import { oidcService } from "../services/oidcService";
import { jwtService } from "../services/jwtService";
import { authCodeService } from "../services/authCodeService";
import { userService } from "../services/userService";
import { refreshTokenService } from "../services/refreshTokenService";
import AppError from "../middlewares/appError";
import {
  SanitizedUser,
  LoginCredentials,
  UserWithRoles,
} from "../types/user.types";
import { catchAsync } from "../utils/catchAsync";
import { generateToken } from "../utils/token";

// Store authorization codes temporarily (in production, use Redis)
interface AuthCode {
  user_id: string;
  client_id: string;
  redirect_uri: string;
  expires_at: number;
  state?: string;
}

const signToken = (id: string, audience?: string): string => {
  return jwtService.signToken(id, audience);
};

// const createSendTokenWithOAuth2 = async (
//   user: SanitizedUser,
//   statusCode: number,
//   res: Response
// ): Promise<void> => {
//   try {
//     const accessToken = signToken(user.id);
//     const refreshToken = await refreshTokenService.createRefreshToken(user.id);
//     const response = {
//       access_token: accessToken,
//       token_type: "Bearer",
//       expires_in: 900, // 15 minutes
//       refresh_token: refreshToken,
//     };

//     res.status(statusCode).json(response);
//   } catch (error) {
//     console.error("❌ Error in createSendTokenWithOAuth2:", error);
//     throw error;
//   }
// };

const createSendTokenWithOAuth2 = async (
  user: SanitizedUser,
  statusCode: number,
  res: Response,
  clientId?: string,
  nonce?: string
): Promise<void> => {
  try {
    const accessToken = signToken(user.id);
    const refreshToken = await refreshTokenService.createRefreshToken(user.id);

    // Generate ID token for OIDC compliance
    const idToken = await oidcService.generateIDToken(
      user,
      clientId || "default",
      nonce
    );

    const response = {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 900, // 15 minutes
      refresh_token: refreshToken,
      id_token: idToken, // OIDC ID token
      scope: "openid profile email",
    };

    res.status(statusCode).json(response);
  } catch (error) {
    console.error("❌ Error in createSendTokenWithOAuth2:", error);
    throw error;
  }
};

// OAuth2 authorize endpoint
const authorize = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    // Validate required parameters
    if (response_type !== "code") {
      return next(
        new AppError("Invalid response_type. Only 'code' is supported", 400)
      );
    }

    if (!client_id) {
      return next(new AppError("client_id is required", 400));
    }

    if (!redirect_uri) {
      return next(new AppError("redirect_uri is required", 400));
    }

    // Validate client
    // const clientConfig = VALID_CLIENTS[client_id as keyof typeof VALID_CLIENTS];
    // if (!clientConfig) {
    //   return next(new AppError("Invalid client_id", 400));
    // }

    // Validate redirect_uri
    // if (!clientConfig.redirectUris.includes(redirect_uri as string)) {
    //   return next(new AppError("Invalid redirect_uri", 400));
    // }

    console.log("✅ Authorization request validated");

    // Return HTML login form instead of redirecting
    const loginForm = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Service - Login</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 400px;
                margin: 50px auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .login-form {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input[type="email"], input[type="password"] {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
            }
            button {
                width: 100%;
                padding: 12px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background-color: #0056b3;
            }
            .error {
                color: red;
                margin-bottom: 15px;
                padding: 10px;
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 4px;
            }
            h2 {
                text-align: center;
                margin-bottom: 30px;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="login-form">
            <h2>Login to Admin Service</h2>
            <div id="error-message" class="error" style="display: none;"></div>
            <form id="loginForm" action="/api/v1/oauth2/login?${new URLSearchParams(
              req.query as any
            ).toString()}" method="POST">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit">Login</button>
            </form>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', function(e) {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                if (!email || !password) {
                    e.preventDefault();
                    document.getElementById('error-message').textContent = 'Email and password are required';
                    document.getElementById('error-message').style.display = 'block';
                }
            });

            // Show error from URL params if redirected back
            const urlParams = new URLSearchParams(window.location.search);
            const error = urlParams.get('error');
            if (error) {
                const errorDiv = document.getElementById('error-message');
                errorDiv.textContent = error === 'invalid_credentials' ? 'Invalid email or password' : 'Login failed';
                errorDiv.style.display = 'block';
            }
        </script>
    </body>
    </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(loginForm);
  }
);

// OAuth2 login endpoint
const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    const user = await userService.authenticateUser(email, password);

    if (!user) {
      console.log("❌ Authentication failed for:", email);

      // When authentication fails, redirect back with error but preserve state
      if (redirect_uri) {
        const errorUrl = new URL(redirect_uri as string);
        errorUrl.searchParams.set("error", "access_denied");
        errorUrl.searchParams.set("error_description", "Invalid credentials");
        if (state) {
          errorUrl.searchParams.set("state", state as string);
        }
        console.log(
          "🔄 Redirecting with error and state:",
          errorUrl.toString()
        );
        return res.redirect(errorUrl.toString());
      }

      return next(new AppError("Invalid credentials", 401));
    }

    // Generate authorization code
    const authCode = generateToken();
    const authCodeExpiresIn = process.env.AUTH_CODE_EXPIRES_IN
      ? parseInt(process.env.AUTH_CODE_EXPIRES_IN) * 1000 // Convert seconds to milliseconds
      : 10 * 60 * 1000; // Default: 10 minutes in milliseconds

    const expiresAt = Date.now() + authCodeExpiresIn;

    await authCodeService.storeAuthCode(authCode, {
      user_id: user.id,
      client_id: client_id as string,
      redirect_uri: redirect_uri as string,
      expires_at: expiresAt,
      state: state as string,
    });

    // Build redirect URL with authorization code AND state
    const url = new URL(redirect_uri as string);
    url.searchParams.set("code", authCode);

    // IMPORTANT: Always include the state parameter if it was provided
    if (state) {
      url.searchParams.set("state", state as string);
    }

    console.log("🔄 Redirecting with auth code to:", url.toString());
    res.redirect(url.toString());
  }
);

// OAuth2 token exchange endpoint
const getJWTFromCode = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let { code, client_id, client_secret, redirect_uri, grant_type, state } =
      req.body;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const credentials = Buffer.from(
          authHeader.split(" ")[1],
          "base64"
        ).toString();
        const [headerClientId, headerClientSecret] = credentials.split(":");

        // console.log("📋 Found Basic Auth credentials:", {
        //   client_id: headerClientId,
        //   has_secret: !!headerClientSecret,
        // });

        // Use header credentials if body doesn't have them
        if (!client_id) client_id = headerClientId;
        if (!client_secret) client_secret = headerClientSecret;

        console.log("✅ Using client credentials from Authorization header");
      } catch (error) {
        console.log("❌ Failed to decode Basic Auth header:", error);
      }
    }

    // Validate grant type
    if (grant_type !== "authorization_code") {
      res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Only authorization_code grant type is supported",
      });
      return;
    }

    // Validate required parameters
    if (!code) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Authorization code is required",
      });
      return;
    }

    if (!client_id) {
      console.log("❌ Missing client_id in both body and Authorization header");
      console.log("Available in body:", Object.keys(req.body));
      console.log(
        "Authorization header:",
        req.headers.authorization ? "present" : "missing"
      );
      res.status(400).json({
        error: "invalid_request",
        error_description: "client_id is required",
      });
      return;
    }

    const authData = await authCodeService.consumeAuthCode(code);

    if (!authData) {
      res.status(400).json({
        error: "invalid_grant",
        error_description: "Invalid or expired authorization code",
      });
      return;
    }

    // Check expiration
    if (authData.expires_at < Date.now()) {
      res.status(400).json({
        error: "invalid_grant",
        error_description: "Authorization code has expired",
      });
      return;
    }

    // Validate client_id matches
    if (authData.client_id !== client_id) {
      res.status(400).json({
        error: "invalid_grant",
        error_description:
          "Authorization code was issued to a different client",
      });
      return;
    }

    // Get user
    const user = await userService.getUserById(authData.user_id);

    if (!user) {
      res.status(400).json({
        error: "invalid_grant",
        error_description: "User associated with code no longer exists",
      });
      return;
    }

    try {
      await createSendTokenWithOAuth2(user, 200, res);
      console.log("✅ Token response sent successfully");
    } catch (error) {
      console.error("❌ Error creating tokens:", error);
      res.status(500).json({
        error: "server_error",
        error_description: "Failed to generate tokens",
      });
    }
  }
);

// OAuth2 refresh token endpoint
const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("=== REFRESH TOKEN REQUEST ===");
    console.log("Body:", req.body);

    const { refresh_token, grant_type } = req.body;

    if (grant_type !== "refresh_token") {
      res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Only refresh_token grant type is supported",
      });
      return;
    }

    if (!refresh_token) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "refresh_token is required",
      });
      return;
    }

    try {
      // Validating refresh token
      const validatedUser = await refreshTokenService.validateRefreshToken(
        refresh_token
      );

      if (!validatedUser) {
        res.status(401).json({
          error: "invalid_grant",
          error_description: "Invalid or expired refresh token",
        });
        return;
      }

      // Getting user details
      const user = await userService.getUserById(validatedUser.id);

      if (!user) {
        res.status(401).json({
          error: "invalid_grant",
          error_description: "User no longer exists",
        });
        return;
      }

      // Rotating refresh token
      await refreshTokenService.rotateRefreshToken(refresh_token);

      // Creating new tokens
      await createSendTokenWithOAuth2(user, 200, res);
      return;
    } catch (error) {
      // Refresh token error
      res.status(401).json({
        error: "invalid_grant",
        error_description: "Invalid or expired refresh token",
      });
      return;
    }
  }
);

// OAuth2 userinfo endpoint
// const getUserInfo = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const user = (req as any).user as UserWithRoles;

//     if (!user) {
//       return next(new AppError("User not found", 404));
//     }

//     const userInfo = {
//       sub: user.id,
//       preferred_username: user.username,
//       email: user.email,
//       name: user.full_name || user.username,
//       roles: user.roles.map((r) => r.role.name),
//     };

//     res.json(userInfo);
//   }
// );

const getUserInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "invalid_token",
        error_description: "Bearer token required",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwtService.verifyToken(token) as any;
      const user = await userService.getUserById(decoded.id);

      if (!user) {
        res.status(401).json({
          error: "invalid_token",
          error_description: "User not found",
        });
        return;
      }

      // OIDC-compliant user info response
      const userInfo = {
        sub: user.id,
        name: user.full_name,
        email: user.email,
        preferred_username: user.username,
        email_verified: true,
        roles: user.roles?.map((r) => r.name) || [],
        groups: user.roles?.map((r) => r.name) || [],
      };
      console.log(userInfo);

      res.status(200).json(userInfo);
    } catch (error) {
      res.status(401).json({
        error: "invalid_token",
        error_description: "Token verification failed",
      });
    }
  }
);

export const oAuth2Controller = {
  authorize,
  login,
  getJWTFromCode,
  refreshToken,
  getUserInfo,
};
