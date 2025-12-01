import express from "express";
import { userController } from "../controllers/userController";
import { authController } from "../controllers/authController";

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);
router.use(authController.restrictTo("admin"));

// GET /api/v1/users - Get all users with filtering and pagination
router.get("/", userController.getAllUsers);

// GET /api/v1/users/:id - Get single user
router.get("/:id", userController.getUser);
router.delete("/:id", userController.deleteUser);

router.patch("/:id/status", userController.updateIsActive);
router.patch("/:id/role", userController.updateRole);

export default router;
