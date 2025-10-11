import { Role, Permission, User } from "@prisma/client";

export interface CreateRoleDto {
  name: string;
  description: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface AssignPermissionDto {
  permissionId: string;
}

export interface AssignRoleToUserDto {
  userId: string;
}

export interface RoleWithRelations extends Role {
  permissions: {
    permission: Permission;
  }[];
  users?: {
    user: {
      id: string;
      username: string;
      email: string;
    };
  }[];
}

export interface SanitizedRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  users: {
    id: string;
    username: string;
    email: string;
  }[];
}
