import express from "express";
import { permissionController } from "../controllers/permissionController";
import { authController } from "../controllers/authController";

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Permission CRUD routes
router
  .route("/")
  .get(permissionController.getAllPermissions)
  .post(permissionController.createPermission);

router
  .route("/:id")
  .get(permissionController.getPermission)
  .patch(permissionController.updatePermission)
  .delete(permissionController.deletePermission);

export default router;
