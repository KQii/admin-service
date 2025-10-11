import { permissionModel } from "../models/permissionModel";
import { QueryResult } from "../utils/apiFeatures";
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionWithRelations,
  SanitizedPermission,
} from "../types/permission.types";

const sanitizePermission = (
  permission: PermissionWithRelations
): SanitizedPermission => {
  return {
    id: permission.id,
    name: permission.name,
    roles: permission.roles ? permission.roles.map((rp) => rp.role) : [],
  };
};

export const permissionService = {
  getAllPermissions: async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10
  ): Promise<QueryResult<SanitizedPermission>> => {
    const skip = (page - 1) * limit;
    const [permissions, total] = await Promise.all([
      permissionModel.findAll(filters, skip, limit),
      permissionModel.count(filters),
    ]);

    return {
      data: permissions.map((permission) =>
        sanitizePermission(permission as PermissionWithRelations)
      ),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  },

  getPermissionById: async (
    id: string
  ): Promise<SanitizedPermission | null> => {
    const permission = await permissionModel.findById(id);
    if (!permission) return null;
    return sanitizePermission(permission as PermissionWithRelations);
  },

  getPermissionByName: async (
    name: string
  ): Promise<SanitizedPermission | null> => {
    const permission = await permissionModel.findByName(name);
    if (!permission) return null;
    return sanitizePermission(permission as PermissionWithRelations);
  },

  createPermission: async (
    permissionData: CreatePermissionDto
  ): Promise<SanitizedPermission> => {
    const permission = await permissionModel.createPermission(
      permissionData.name
    );
    return sanitizePermission(permission as PermissionWithRelations);
  },

  updatePermission: async (
    id: string,
    permissionData: UpdatePermissionDto
  ): Promise<SanitizedPermission> => {
    const permission = await permissionModel.updatePermission(
      id,
      permissionData.name!
    );
    return sanitizePermission(permission as PermissionWithRelations);
  },

  deletePermission: async (id: string): Promise<void> => {
    await permissionModel.deletePermission(id);
  },
};
