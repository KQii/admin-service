import { Request } from "express";
import { jwtService } from "./jwtService";
import { SanitizedUserWithRole } from "../types/user.types";

export const oidcService = {
  // Generate OpenID Configuration
  getOpenIDConfiguration: (req: Request) => {
    // const baseUrl = `${req.protocol}://${req.get("host")}`;
    const baseUrl =
      process.env.ISSUER_URL || `http://localhost:${process.env.PORT || 3001}`;

    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/api/v1/oauth2/authorize`,
      token_endpoint: `${baseUrl}/api/v1/oauth2/token`,
      userinfo_endpoint: `${baseUrl}/api/v1/oauth2/userinfo`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,

      // Supported response types
      response_types_supported: ["code", "code id_token"],

      // Supported scopes
      scopes_supported: ["openid", "profile", "email", "read:user"],

      // Supported grant types
      grant_types_supported: ["authorization_code", "refresh_token"],

      // Supported authentication methods
      token_endpoint_auth_methods_supported: [
        "client_secret_basic",
        "client_secret_post",
        "none",
      ],

      // Supported signing algorithms
      id_token_signing_alg_values_supported: ["RS256"],

      // Supported subject types
      subject_types_supported: ["public"],

      // Claims supported
      claims_supported: [
        "iss",
        "sub",
        "aud",
        "exp",
        "iat",
        "auth_time",
        "name",
        "email",
        "preferred_username",
        "groups",
        "roles",
      ],

      // Code challenge methods (PKCE)
      code_challenge_methods_supported: ["plain", "S256"],

      // Additional endpoints
      revocation_endpoint: `${baseUrl}/api/v1/oauth2/revoke`,
      introspection_endpoint: `${baseUrl}/api/v1/oauth2/introspect`,
    };
  },

  // Generate JWKS (JSON Web Key Set) for RS256
  getJWKS: () => {
    const keyComponents = jwtService.getPublicKeyComponents();
    const keyId = jwtService.getKeyId();

    return {
      keys: [
        {
          kty: "RSA", // Key type: RSA asymmetric
          kid: keyId, // Key ID from JWT service
          alg: "RS256", // Algorithm: RSA with SHA-256
          use: "sig", // Usage: signature
          n: keyComponents.n, // RSA public key modulus (base64url)
          e: keyComponents.e, // RSA public key exponent (base64url)
        },
      ],
    };
  },

  // Generate ID Token for OIDC using RS256
  generateIDToken: async (
    user: SanitizedUserWithRole,
    clientId: string,
    nonce?: string
  ) => {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      sub: user.id, // Subject (user ID)
      auth_time: now,

      // Standard claims
      name: user.username,
      email: user.email,
      preferred_username: user.username,
      email_verified: true,

      // Custom claims
      roles: user.role,
      groups: user.role,

      // Nonce for security (if provided)
      ...(nonce && { nonce }),
    };

    // Use jwtService to generate ID token with RS256
    return jwtService.generateIDToken(payload, clientId);
  },
};
