import express from "express";
import { wellKnownController } from "../controllers/wellKnownController";

const router = express.Router();

// OpenID Configuration Discovery
router.get("/openid-configuration", wellKnownController.getOpenIDConfiguration);

// JSON Web Key Set
router.get("/jwks.json", wellKnownController.getJWKS);

export default router;
