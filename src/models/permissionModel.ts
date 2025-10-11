import { Permission, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const permissionModel = {
  findAll: (filters?: Record<string, any>, skip?: number, limit?: number) =>
    prisma.permission.findMany({
      where: filters,
      skip: skip,
      take: limit,
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
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
    prisma.permission.count({
      where: filters,
    }),

  findById: (id: string) =>
    prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    }),

  findByName: (name: string) =>
    prisma.permission.findUnique({
      where: { name },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    }),

  createPermission: (name: string) =>
    prisma.permission.create({
      data: {
        name,
      },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    }),

  updatePermission: (id: string, name: string) =>
    prisma.permission.update({
      where: { id },
      data: {
        name,
      },
      include: {
        roles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    }),

  deletePermission: (id: string) =>
    prisma.permission.delete({
      where: { id },
    }),
};
