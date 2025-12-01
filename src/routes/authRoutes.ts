import express from "express";

import { authController } from "../controllers/authController";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.protect, authController.logout);
router.post("/refresh", authController.refreshToken);

router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.patch(
  "/update-password",
  authController.protect,
  authController.updatePassword
);

router.post(
  "/create",
  authController.protect,
  authController.restrictTo("admin"),
  authController.createUser
);
router.get("/setup-user/:token", authController.getUserBySetupToken);
router.patch("/setup-user/:token", authController.setupUser);
router.patch(
  "/regenerateToken",
  authController.protect,
  authController.regenerateSetupToken
);

export default router;
