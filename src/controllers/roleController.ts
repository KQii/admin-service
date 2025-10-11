import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { roleService } from "../services/roleService";
import AppError from "../middlewares/appError";
import { CreateRoleDto, UpdateRoleDto } from "../types/role.types";

export const roleController = {
  getAllRoles: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = req.query.filters
        ? JSON.parse(req.query.filters as string)
        : undefined;

      const result = await roleService.getAllRoles(filters, page, limit);

      res.status(200).json({
        status: "success",
        results: result.data.length,
        pagination: {
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          total: result.total,
        },
        data: {
          roles: result.data,
        },
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

  assignPermissionToRole: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { permissionId } = req.body;

      if (!permissionId) {
        return next(new AppError("Please provide permission ID", 400));
      }

      const role = await roleService.getRoleById(req.params.id);
      if (!role) {
        return next(new AppError("No role found with that ID", 404));
      }

      // Check if permission is already assigned
      const hasPermission = role.permissions.some((p) => p.id === permissionId);
      if (hasPermission) {
        return next(
          new AppError("Permission is already assigned to this role", 409)
        );
      }

      await roleService.assignPermissionToRole(req.params.id, permissionId);

      res.status(200).json({
        status: "success",
        message: "Permission assigned to role successfully",
      });
    }
  ),

  removePermissionFromRole: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { permissionId } = req.params;

      const role = await roleService.getRoleById(req.params.id);
      if (!role) {
        return next(new AppError("No role found with that ID", 404));
      }

      // Check if permission is assigned
      const hasPermission = role.permissions.some((p) => p.id === permissionId);
      if (!hasPermission) {
        return next(
          new AppError("Permission is not assigned to this role", 404)
        );
      }

      await roleService.removePermissionFromRole(req.params.id, permissionId);

      res.status(200).json({
        status: "success",
        message: "Permission removed from role successfully",
      });
    }
  ),

  assignRoleToUser: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.body;

      if (!userId) {
        return next(new AppError("Please provide user ID", 400));
      }

      const role = await roleService.getRoleById(req.params.id);
      if (!role) {
        return next(new AppError("No role found with that ID", 404));
      }

      // Check if user already has this role
      const hasRole = role.users.some((u) => u.id === userId);
      if (hasRole) {
        return next(new AppError("User already has this role", 409));
      }

      await roleService.assignRoleToUser(userId, req.params.id);

      res.status(200).json({
        status: "success",
        message: "Role assigned to user successfully",
      });
    }
  ),

  removeRoleFromUser: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      const role = await roleService.getRoleById(req.params.id);
      if (!role) {
        return next(new AppError("No role found with that ID", 404));
      }

      // Check if user has this role
      const hasRole = role.users.some((u) => u.id === userId);
      if (!hasRole) {
        return next(new AppError("User does not have this role", 404));
      }

      await roleService.removeRoleFromUser(userId, req.params.id);

      res.status(200).json({
        status: "success",
        message: "Role removed from user successfully",
      });
    }
  ),

  getUserRoles: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;

      const roles = await roleService.getUserRoles(userId);

      res.status(200).json({
        status: "success",
        results: roles.length,
        data: {
          roles,
        },
      });
    }
  ),
};
