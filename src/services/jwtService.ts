import jwt from "jsonwebtoken";
import type { SignOptions, JwtPayload } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Load RSA keys
const privateKeyPath = path.join(process.cwd(), "keys", "private-key.pem");
const publicKeyPath = path.join(process.cwd(), "keys", "public-key.pem");

let privateKey: string;
let publicKey: string;

try {
  privateKey = fs.readFileSync(privateKeyPath, "utf8");
  publicKey = fs.readFileSync(publicKeyPath, "utf8");
} catch (error) {
  console.error("Failed to load RSA keys:", error);
  throw new Error("RSA keys not found. Please generate them first.");
}

// Generate key ID from public key
const generateKeyId = (publicKey: string): string => {
  return crypto
    .createHash("sha256")
    .update(publicKey)
    .digest("hex")
    .substring(0, 16);
};

const keyId = generateKeyId(publicKey);

export const jwtService = {
  signToken: (id: string, audience?: string): string => {
    const payload: { id: string; aud?: string } = { id };
    if (audience) payload.aud = audience;

    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

    return jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn,
      keyid: keyId,
      // issuer:
      //   process.env.ISSUER_URL ||
      //   `http://localhost:${process.env.PORT || 3001}`,
      issuer: "http://host.docker.internal:3001",
    } as SignOptions);
  },

  verifyToken: (token: string): JwtPayload => {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      // issuer:
      //   process.env.ISSUER_URL ||
      //   `http://localhost:${process.env.PORT || 3001}`,
      issuer: "http://host.docker.internal:3001",
    }) as JwtPayload;
  },

  decodeToken: (token: string): JwtPayload | null => {
    return jwt.decode(token) as JwtPayload;
  },

  getPublicKey: (): string => {
    return publicKey;
  },

  getKeyId: (): string => {
    return keyId;
  },

  // Generate ID token with custom claims (for OIDC)
  generateIDToken: (payload: any, audience?: string): string => {
    const now = Math.floor(Date.now() / 1000);

    const idTokenPayload = {
      ...payload,
      // iss:
      //   process.env.ISSUER_URL ||
      //   `http://localhost:${process.env.PORT || 3001}`,
      iss: "http://host.docker.internal:3001",
      iat: now,
      exp: now + 3600, // 1 hour
      aud: audience,
    };

    return jwt.sign(idTokenPayload, privateKey, {
      algorithm: "RS256",
      keyid: keyId,
    });
  },

  // Extract public key components for JWKS
  getPublicKeyComponents: () => {
    try {
      const keyObject = crypto.createPublicKey(publicKey);

      // Export key in JWK format (Node.js 15+)
      if (keyObject.export && typeof keyObject.export === "function") {
        try {
          const jwk = keyObject.export({ format: "jwk" }) as any;
          return {
            n: jwk.n, // Modulus
            e: jwk.e, // Exponent
          };
        } catch (error) {
          console.log("JWK export not available, using fallback method");
        }
      }

      // Fallback: Parse PEM manually
      const pemContent = publicKey
        .replace(/-----BEGIN PUBLIC KEY-----/, "")
        .replace(/-----END PUBLIC KEY-----/, "")
        .replace(/\s/g, "");

      const der = Buffer.from(pemContent, "base64");

      // This is a simplified DER parsing - for production use a proper ASN.1 library
      // For now, we'll use standard RSA exponent and a placeholder modulus
      return {
        n: der.toString("base64url").substring(0, 64), // Simplified modulus
        e: "AQAB", // Standard RSA exponent (65537)
      };
    } catch (error) {
      console.error("Error extracting public key components:", error);
      // Fallback values for development
      return {
        n: "placeholder-modulus-value-for-development-only",
        e: "AQAB", // Standard RSA exponent
      };
    }
  },
};
