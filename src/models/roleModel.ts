import { Role, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const roleModel = {
  findAll: (filters?: Record<string, any>, skip?: number, limit?: number) =>
    prisma.role.findMany({
      where: filters,
      skip: skip,
      take: limit,
      include: {
        users: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

  findManyWithQuery: (queryOptions: any) => {
    const { select, ...rest } = queryOptions;

    // If select is provided, use it; otherwise include users by default
    return prisma.role.findMany({
      ...rest,
      ...(select ? { select } : { include: { users: true } }),
    });
  },

  count: (filters?: Record<string, any>) =>
    prisma.role.count({
      where: filters,
    }),

  findById: (id: string) =>
    prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
      },
    }),

  findByName: (name: string) =>
    prisma.role.findUnique({
      where: { name },
      include: {
        users: true,
      },
    }),

  createRole: (name: string, description: string) =>
    prisma.role.create({
      data: {
        name,
        description,
      },
      include: {
        users: true,
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
        users: true,
      },
    }),

  deleteRole: (id: string) =>
    prisma.role.delete({
      where: { id },
    }),
};
