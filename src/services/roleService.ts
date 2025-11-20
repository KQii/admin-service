import { roleModel } from "../models/roleModel";
import { PrismaQueryBuilder } from "../utils/prismaQueryBuilder";
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleWithRelations,
  SanitizedRole,
} from "../types/role.types";

export const roleService = {
  getAllRoles: async (queryString: any): Promise<any> => {
    // Use 'name' as default sort for roles since they don't have created_at
    const queryBuilder = new PrismaQueryBuilder(queryString, {
      defaultSort: { name: "asc" },
    });

    // Build the Prisma query
    queryBuilder.filter().sort().limitFields().paginate();

    const prismaQuery = queryBuilder.getQuery();
    const { page, limit } = queryBuilder.getPaginationParams();

    // Execute query with Prisma
    const roles = await roleModel.findManyWithQuery(prismaQuery);

    // Sanitize roles and their users to remove sensitive information
    const sanitizedRoles = roles.map((role: any) => {
      // If role has users array, sanitize each user
      if (role.users && Array.isArray(role.users)) {
        return {
          ...role,
          users: role.users.map((user: any) => {
            // Remove sensitive fields from user
            const {
              password,
              password_changed_at,
              password_reset_token,
              password_reset_expires,
              setup_token,
              setup_expires,
              refresh_token,
              refresh_token_expires,
              ...safeUser
            } = user;
            return safeUser;
          }),
        };
      }
      // If using field selection without users, return as is
      return role;
    });

    // Get total count for pagination (with same filters)
    const total = await roleModel.count(prismaQuery.where);
    const totalPages = Math.ceil(total / limit);

    return {
      roles: sanitizedRoles,
      metadata: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },

  getRoleById: async (id: string): Promise<SanitizedRole | null> => {
    const role = await roleModel.findById(id);
    if (!role) return null;
    return role;
  },

  getRoleByName: async (name: string): Promise<SanitizedRole | null> => {
    const role = await roleModel.findByName(name);
    if (!role) return null;
    return role;
  },

  createRole: async (roleData: CreateRoleDto): Promise<SanitizedRole> => {
    const role = await roleModel.createRole(
      roleData.name,
      roleData.description
    );
    return role;
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
    return role;
  },

  deleteRole: async (id: string): Promise<void> => {
    await roleModel.deleteRole(id);
  },
};
