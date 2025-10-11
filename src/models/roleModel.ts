import { Role, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const roleModel = {
  findAll: (filters?: Record<string, any>, skip?: number, limit?: number) =>
    prisma.role.findMany({
      where: filters,
      skip: skip,
      take: limit,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

  count: (filters?: Record<string, any>) =>
    prisma.role.count({
      where: filters,
    }),

  findById: (id: string) =>
    prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    }),

  findByName: (name: string) =>
    prisma.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    }),

  createRole: (name: string, description: string) =>
    prisma.role.create({
      data: {
        name,
        description,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    }),

  updateRole: (id: string, name?: string, description?: string) =>
    prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    }),

  deleteRole: (id: string) =>
    prisma.role.delete({
      where: { id },
    }),

  assignPermissionToRole: (roleId: string, permissionId: string) =>
    prisma.rolePermission.create({
      data: {
        role_id: roleId,
        permission_id: permissionId,
      },
    }),

  removePermissionFromRole: (roleId: string, permissionId: string) =>
    prisma.rolePermission.delete({
      where: {
        role_id_permission_id: {
          role_id: roleId,
          permission_id: permissionId,
        },
      },
    }),

  assignRoleToUser: (userId: string, roleId: string) =>
    prisma.userRole.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    }),

  removeRoleFromUser: (userId: string, roleId: string) =>
    prisma.userRole.delete({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: roleId,
        },
      },
    }),

  getRolesByUserId: (userId: string) =>
    prisma.userRole.findMany({
      where: { user_id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    }),
};
