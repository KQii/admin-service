import { User, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userModel = {
  findAll: (filters?: Record<string, any>, skip?: number, limit?: number) =>
    prisma.user.findMany({
      where: filters,
      skip: skip,
      take: limit,
      include: {
        role: true,
      },
      orderBy: {
        created_at: "desc",
      },
    }),

  findAllUsers: () =>
    prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        created_at: "desc",
      },
    }),

  findManyWithQuery: (queryOptions: any) => {
    const { select, ...rest } = queryOptions;

    // If select is provided, merge with role inclusion
    // Otherwise just include role by default
    return prisma.user.findMany({
      ...rest,
      ...(select ? { select } : { include: { role: true } }),
    });
  },

  count: (filters?: Record<string, any>) =>
    prisma.user.count({
      where: filters,
    }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    }),

  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        role: true,
      },
    }),

  findByEmailAndVerified: (email: string, is_verified: boolean) =>
    prisma.user.findUnique({
      where: {
        email,
        is_verified,
      },
      include: {
        role: true,
      },
    }),

  findByUsername: (username: string) =>
    prisma.user.findUnique({
      where: {
        username,
      },
      include: {
        role: true,
      },
    }),

  findByResetToken: (token: string) =>
    prisma.user.findFirst({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          gt: new Date(Date.now()),
        },
      },
      include: {
        role: true,
      },
    }),

  findBySetupTokenAndNotVerified: (token: string, is_verified: boolean) =>
    prisma.user.findFirst({
      where: {
        is_verified,
        setup_token: token,
        setup_expires: {
          gt: new Date(Date.now()),
        },
      },
      include: {
        role: true,
      },
    }),

  createUser: (
    username: string,
    email: string,
    password: string,
    is_verified: boolean,
    roleId: string
  ) =>
    prisma.user.create({
      data: {
        username,
        email,
        password,
        is_verified,
        roleId,
      },
      include: {
        role: true,
      },
    }),

  updateLastLogin: (id: string) =>
    prisma.user.update({
      where: { id },
      data: {
        last_login: new Date(),
      },
      include: {
        role: true,
      },
    }),

  updatePassword: (id: string, password: string) =>
    prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
        password_changed_at: new Date(Date.now() - 1000),
      },
      include: {
        role: true,
      },
    }),

  updatePasswordResetToken: (
    id: string,
    resetToken: string | null = null,
    expiresAt: Date | null = null
  ) =>
    prisma.user.update({
      where: {
        id,
      },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: expiresAt,
      },
      include: {
        role: true,
      },
    }),

  updatePasswordInfo: (id: string, password: string) =>
    prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
        password_changed_at: new Date(Date.now() - 1000),
        password_reset_token: null,
        password_reset_expires: null,
      },
      include: {
        role: true,
      },
    }),

  updateSetupToken: (id: string, token: string, expiresAt: Date) =>
    prisma.user.update({
      where: {
        id,
      },
      data: {
        setup_token: token,
        setup_expires: expiresAt,
      },
      include: {
        role: true,
      },
    }),

  completeSetup: (id: string, password: string, is_verified: boolean) =>
    prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
        is_verified,
        setup_token: null,
        setup_expires: null,
        password_changed_at: new Date(Date.now() - 1000),
      },
      include: {
        role: true,
      },
    }),

  updateRefreshToken: (
    userId: string,
    token: string | null,
    expiresAt: Date | null
  ) =>
    prisma.user.update({
      where: { id: userId },
      data: {
        refresh_token: token,
        refresh_token_expires: expiresAt,
      },
      include: {
        role: true,
      },
    }),

  updateIsActive: (id: string, isActive: boolean) =>
    prisma.user.update({
      where: { id },
      data: {
        is_active: isActive,
      },
      include: {
        role: true,
      },
    }),

  findByRefreshToken: (refreshToken: string) =>
    prisma.user.findFirst({
      where: {
        refresh_token: refreshToken,
        refresh_token_expires: {
          gt: new Date(),
        },
      },
      include: {
        role: true,
      },
    }),

  deleteUser: (id: string) =>
    prisma.user.delete({
      where: { id },
    }),

  updateRoleId: (id: string, roleId: string) =>
    prisma.user.update({
      where: { id },
      data: {
        roleId: roleId,
      },
      include: {
        role: true,
      },
    }),
};
