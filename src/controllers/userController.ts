import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { userService } from "../services/userService";
import AppError from "../middlewares/appError";
import { roleService } from "../services/roleService";

interface QueryParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}

export const userController = {
  getAllUsers: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await userService.getAllUsers(req.query);

      return res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.metadata,
      });
    }
  ),

  getUser: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.getUserById(req.params.id);

      if (!user) {
        return next(new AppError("No user found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    }
  ),

  updateIsActive: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.body.is_active === undefined) {
        return next(new AppError("Please provide a status", 400));
      }

      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return next(new AppError("No user found with that ID", 404));
      }

      if (user.id === req.user.id) {
        return next(
          new AppError("You are not allowed to update your status", 403)
        );
      }

      if (user.role.name === "admin") {
        return next(
          new AppError(
            "You are not allowed to update the status of an admin account",
            403
          )
        );
      }

      const updatedUser = await userService.updateUserByIsActive(
        req.params.id,
        req.body
      );

      res.status(200).json({
        status: "success",
        data: updatedUser,
      });
    }
  ),

  updateRole: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.body.roleId) {
        return next(new AppError("Please provide a Role ID", 400));
      }

      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return next(new AppError("No user found with that ID", 404));
      }

      if (user.id === req.user.id) {
        return next(
          new AppError("You are not allowed to change your role", 403)
        );
      }

      if (user.role.name === "admin") {
        return next(
          new AppError(
            "You are not allowed to change the role of an admin account",
            403
          )
        );
      }

      const role = await roleService.getRoleById(req.body.roleId);
      if (!role) {
        return next(new AppError("No role found with that ID", 404));
      }

      const updatedUser = await userService.updateUserByRoleId(
        req.params.id,
        req.body
      );

      res.status(200).json({
        status: "success",
        data: updatedUser,
      });
    }
  ),

  deleteUser: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.getUserById(req.params.id);

      if (!user) {
        return next(new AppError("No user found with that ID", 404));
      }

      if (user.id === req.user.id) {
        return next(
          new AppError("You are not allowed to delete your status", 403)
        );
      }

      if (user.role.name === "admin") {
        return next(
          new AppError("You are not allowed to delete an admin account", 403)
        );
      }

      await userService.deleteUser(req.params.id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  ),
};
