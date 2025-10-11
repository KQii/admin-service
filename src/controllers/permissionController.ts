import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { permissionService } from "../services/permissionService";
import AppError from "../middlewares/appError";
import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from "../types/permission.types";

export const permissionController = {
  getAllPermissions: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = req.query.filters
        ? JSON.parse(req.query.filters as string)
        : undefined;

      const result = await permissionService.getAllPermissions(
        filters,
        page,
        limit
      );

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
          permissions: result.data,
        },
      });
    }
  ),

  getPermission: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const permission = await permissionService.getPermissionById(
        req.params.id
      );

      if (!permission) {
        return next(new AppError("No permission found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          permission,
        },
      });
    }
  ),

  createPermission: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name }: CreatePermissionDto = req.body;

      if (!name) {
        return next(new AppError("Please provide permission name", 400));
      }

      // Check if permission with this name already exists
      const existingPermission = await permissionService.getPermissionByName(
        name
      );
      if (existingPermission) {
        return next(
          new AppError("A permission with this name already exists", 409)
        );
      }

      const permission = await permissionService.createPermission({ name });

      res.status(201).json({
        status: "success",
        data: {
          permission,
        },
      });
    }
  ),

  updatePermission: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name }: UpdatePermissionDto = req.body;

      if (!name) {
        return next(new AppError("Please provide permission name", 400));
      }

      // Check if permission exists
      const existingPermission = await permissionService.getPermissionById(
        req.params.id
      );
      if (!existingPermission) {
        return next(new AppError("No permission found with that ID", 404));
      }

      // Check if name conflicts with existing permission
      if (name !== existingPermission.name) {
        const permissionWithSameName =
          await permissionService.getPermissionByName(name);
        if (permissionWithSameName) {
          return next(
            new AppError("A permission with this name already exists", 409)
          );
        }
      }

      const permission = await permissionService.updatePermission(
        req.params.id,
        { name }
      );

      res.status(200).json({
        status: "success",
        data: {
          permission,
        },
      });
    }
  ),

  deletePermission: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const permission = await permissionService.getPermissionById(
        req.params.id
      );

      if (!permission) {
        return next(new AppError("No permission found with that ID", 404));
      }

      // Check if permission is assigned to any roles
      if (permission.roles && permission.roles.length > 0) {
        return next(
          new AppError(
            "Cannot delete permission that is assigned to roles. Please remove this permission from all roles first.",
            400
          )
        );
      }

      await permissionService.deletePermission(req.params.id);

      res.status(204).json({
        status: "success",
        data: null,
      });
    }
  ),
};
