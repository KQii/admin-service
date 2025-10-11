import express from "express";

import { authController } from "../controllers/authController";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.protect, authController.logout);
router.post("/refresh", authController.refreshToken);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);

router.post("/create", authController.protect, authController.createUser);
router.patch("/setupAccount/:token", authController.setupUser);
router.patch(
  "/regenerateToken",
  authController.protect,
  authController.regenerateSetupToken
);

export default router;
