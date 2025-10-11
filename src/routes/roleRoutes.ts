import express from "express";
import { roleController } from "../controllers/roleController";
import { authController } from "../controllers/authController";

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Role CRUD routes
router
  .route("/")
  .get(roleController.getAllRoles)
  .post(roleController.createRole);

router
  .route("/:id")
  .get(roleController.getRole)
  .patch(roleController.updateRole)
  .delete(roleController.deleteRole);

// Permission management routes
router.route("/:id/permissions").post(roleController.assignPermissionToRole);

router
  .route("/:id/permissions/:permissionId")
  .delete(roleController.removePermissionFromRole);

// User role management routes
router.route("/:id/users").post(roleController.assignRoleToUser);

router.route("/:id/users/:userId").delete(roleController.removeRoleFromUser);

// Get user roles
router.route("/users/:userId").get(roleController.getUserRoles);

export default router;
