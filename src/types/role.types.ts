import { Role, User } from "@prisma/client";

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
  users: {
    id: string;
    username: string;
    email: string;
  }[];
}
