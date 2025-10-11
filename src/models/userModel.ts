import { User, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userModel = {
  findAll: (filters?: Record<string, any>, skip?: number, limit?: number) =>
    prisma.user.findMany({
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
        created_at: "desc",
      },
    }),

  count: (filters?: Record<string, any>) =>
    prisma.user.count({
      where: filters,
    }),

  findById: (id: string) =>
    prisma.user.findUnique({
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

  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: {
        email,
      },
    }),

  findByUsername: (username: string) =>
    prisma.user.findUnique({
      where: {
        username,
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
    }),

  findBySetupToken: (token: string) =>
    prisma.user.findFirst({
      where: {
        setup_token: token,
        setup_expires: {
          gt: new Date(Date.now()),
        },
      },
    }),

  createUser: (username: string, email: string, password: string) =>
    prisma.user.create({
      data: {
        username,
        email,
        password,
      },
    }),

  updateLastLogin: (id: string) =>
    prisma.user.update({
      where: { id },
      data: {
        last_login: new Date(),
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
    }),

  completeSetup: (id: string, password: string) =>
    prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
        setup_token: null,
        setup_expires: null,
        password_changed_at: new Date(Date.now() - 1000),
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
    }),

  findByRefreshToken: (refreshToken: string) =>
    prisma.user.findFirst({
      where: {
        refresh_token: refreshToken,
        refresh_token_expires: {
          gt: new Date(),
        },
      },
    }),
};
