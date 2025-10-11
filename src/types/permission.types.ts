import { Permission } from "@prisma/client";

export interface CreatePermissionDto {
  name: string;
}

export interface UpdatePermissionDto {
  name?: string;
}

export interface PermissionWithRelations extends Permission {
  roles?: {
    role: {
      id: string;
      name: string;
      description: string;
    };
  }[];
}

export interface SanitizedPermission {
  id: string;
  name: string;
  roles?: {
    id: string;
    name: string;
    description: string;
  }[];
}
