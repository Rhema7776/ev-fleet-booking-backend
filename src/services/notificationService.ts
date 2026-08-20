import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type {
  CreateNotificationInput,
  ListNotificationsQuery,
} from "../validators/notificationValidator";

class NotificationService {
  async list(userId: number, role: string | undefined, query: ListNotificationsQuery) {
    const { isRead, type, page, limit } = query;

    const where: Prisma.NotificationWhereInput = {
      ...(role === "ADMIN" ? {} : { userId }),
      ...(isRead !== undefined ? { isRead } : {}),
      ...(type ? { type } : {}),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: number, userId: number, role: string | undefined) {
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw ApiError.notFound("Notification not found.");
    }

    if (role !== "ADMIN" && notification.userId !== userId) {
      throw ApiError.forbidden("You do not have permission to view this notification.");
    }

    return notification;
  }

  async create(data: CreateNotificationInput) {
    const recipient = await prisma.user.findUnique({ where: { id: data.userId } });

    if (!recipient) {
      throw ApiError.badRequest("Recipient user not found.");
    }

    return prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
      },
    });
  }

  async markAsRead(id: number, userId: number, role: string | undefined) {
    // Reuses the same ownership check as getById.
    await this.getById(id, userId, role);

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: number, userId: number, role: string | undefined) {
    await this.getById(id, userId, role);

    await prisma.notification.delete({ where: { id } });
    return { id };
  }
}

export default new NotificationService();
