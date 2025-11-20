import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { roleService } from "../services/roleService";
import AppError from "../middlewares/appError";
import { CreateRoleDto, UpdateRoleDto } from "../types/role.types";

export const roleController = {
  getAllRoles: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await roleService.getAllRoles(req.query);

      res.status(200).json({
        success: true,
        data: result.roles,
        pagination: result.metadata,
      });
    }
  ),

  getRole: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const role = await roleService.getRoleById(req.params.id);

      if (!role) {
        return next(new AppError("No role found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          role,
        },
      });
    }
  ),

  createRole: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, description }: CreateRoleDto = req.body;

      if (!name || !description) {
        return next(
          new AppError("Please provide role name and description", 400)
        );
      }

      // Check if role with this name already exists
      const existingRole = await roleService.getRoleByName(name);
      if (existingRole) {
        return next(new AppError("A role with this name already exists", 409));
      }

      const role = await roleService.createRole({ name, description });

      res.status(201).json({
        status: "success",
        data: {
          role,
        },
      });
    }
  ),

  updateRole: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, description }: UpdateRoleDto = req.body;

      if (!name && !description) {
        return next(
          new AppError("Please provide at least one field to update", 400)
        );
      }

      // Check if role exists
      const existingRole = await roleService.getRoleById(req.params.id);
      if (!existingRole) {
        return next(new AppError("No role found with that ID", 404));
      }

      // Check if name is being changed and if it conflicts with existing role
      if (name && name !== existingRole.name) {
        const roleWithSameName = await roleService.getRoleByName(name);
        if (roleWithSameName) {
          return next(
            new AppError("A role with this name already exists", 409)
          );
        }
      }

      const role = await roleService.updateRole(req.params.id, {
        name,
        description,
      });

      res.status(200).json({
        status: "success",
        data: {
          role,
        },
      });
    }
  ),

  deleteRole: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const role = await roleService.getRoleById(req.params.id);

      if (!role) {
        return next(new AppError("No role found with that ID", 404));
      }

      // Check if role has users assigned
      if (role.users.length > 0) {
        return next(
          new AppError(
            "Cannot delete role that has users assigned. Please remove all users from this role first.",
            400
          )
        );
      }

      await roleService.deleteRole(req.params.id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  ),
};
