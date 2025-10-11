import { roleModel } from "../models/roleModel";
import { QueryResult } from "../utils/apiFeatures";
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleWithRelations,
  SanitizedRole,
} from "../types/role.types";

const sanitizeRole = (role: RoleWithRelations): SanitizedRole => {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((rp) => rp.permission),
    users: role.users ? role.users.map((ur) => ur.user) : [],
  };
};

export const roleService = {
  getAllRoles: async (
    filters?: Record<string, any>,
    page: number = 1,
    limit: number = 10
  ): Promise<QueryResult<SanitizedRole>> => {
    const skip = (page - 1) * limit;
    const [roles, total] = await Promise.all([
      roleModel.findAll(filters, skip, limit),
      roleModel.count(filters),
    ]);

    return {
      data: roles.map((role) => sanitizeRole(role as RoleWithRelations)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  },

  getRoleById: async (id: string): Promise<SanitizedRole | null> => {
    const role = await roleModel.findById(id);
    if (!role) return null;
    return sanitizeRole(role as RoleWithRelations);
  },

  getRoleByName: async (name: string): Promise<SanitizedRole | null> => {
    const role = await roleModel.findByName(name);
    if (!role) return null;
    return sanitizeRole(role as RoleWithRelations);
  },

  createRole: async (roleData: CreateRoleDto): Promise<SanitizedRole> => {
    const role = await roleModel.createRole(
      roleData.name,
      roleData.description
    );
    return sanitizeRole(role as RoleWithRelations);
  },

  updateRole: async (
    id: string,
    roleData: UpdateRoleDto
  ): Promise<SanitizedRole> => {
    const role = await roleModel.updateRole(
      id,
      roleData.name,
      roleData.description
    );
    return sanitizeRole(role as RoleWithRelations);
  },

  deleteRole: async (id: string): Promise<void> => {
    await roleModel.deleteRole(id);
  },

  assignPermissionToRole: async (
    roleId: string,
    permissionId: string
  ): Promise<void> => {
    await roleModel.assignPermissionToRole(roleId, permissionId);
  },

  removePermissionFromRole: async (
    roleId: string,
    permissionId: string
  ): Promise<void> => {
    await roleModel.removePermissionFromRole(roleId, permissionId);
  },

  assignRoleToUser: async (userId: string, roleId: string): Promise<void> => {
    await roleModel.assignRoleToUser(userId, roleId);
  },

  removeRoleFromUser: async (userId: string, roleId: string): Promise<void> => {
    await roleModel.removeRoleFromUser(userId, roleId);
  },

  getUserRoles: async (userId: string): Promise<SanitizedRole[]> => {
    const userRoles = await roleModel.getRolesByUserId(userId);
    return userRoles.map((ur) => sanitizeRole(ur.role as RoleWithRelations));
  },
};
