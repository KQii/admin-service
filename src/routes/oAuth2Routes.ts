import express from "express";
import { oAuth2Controller } from "../controllers/oAuth2Controller";
import { authController } from "../controllers/authController";

const router = express.Router();

// Grafana OAuth2
router.get("/authorize", oAuth2Controller.authorize);
router.post("/login", oAuth2Controller.login);

// OAuth2 token endpoint - handles both authorization_code and refresh_token
router.post("/token", (req, res, next) => {
  if (req.body.grant_type === "refresh_token") {
    console.log("📋 Routing to refreshToken handler");
    return oAuth2Controller.refreshToken(req, res, next);
  } else if (req.body.grant_type === "authorization_code") {
    console.log("📋 Routing to getJWTFromCode handler");
    return oAuth2Controller.getJWTFromCode(req, res, next);
  } else {
    console.log("❌ Unsupported grant_type:", req.body.grant_type);
    return res.status(400).json({
      error: "unsupported_grant_type",
      error_description:
        "Only authorization_code and refresh_token are supported",
    });
  }
});

router.get("/userinfo", oAuth2Controller.getUserInfo);

// Token revocation endpoint (RFC 7009)
router.post("/revoke", oAuth2Controller.revokeToken);

export default router;
