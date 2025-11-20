import express from "express";
import { roleController } from "../controllers/roleController";
import { authController } from "../controllers/authController";

const router = express.Router();

// Protect all routes after this middleware
// router.use(authController.protect);

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

export default router;
