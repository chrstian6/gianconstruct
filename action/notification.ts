// actions/notifications.ts - UPDATED FOR NEW NOTIFICATION SYSTEM
"use server";

import { notificationService } from "@/lib/notification-services";
import { NotificationQuery } from "@/lib/notification-services";

// Re-export all notification service methods as server actions with role checking
export async function createNotification(params: any) {
  return await notificationService.createNotification(params);
}

export async function getNotifications(
  query: NotificationQuery & {
    currentUserRole: string;
    currentUserId?: string;
  }
) {
  return await notificationService.getNotifications(query);
}

export async function markNotificationAsRead(
notificationId: string, currentUserRole: string, currentUserId?: string, userEmail?: string) {
  return await notificationService.markAsRead(
    notificationId,
    currentUserRole,
    currentUserId
  );
}

export async function markAllNotificationsAsRead(
  userId: string,
  userRole: string,
  userEmail?: string
) {
  return await notificationService.markAllAsRead(userId, userRole, userEmail);
}

export async function deleteNotification(
  notificationId: string,
  userRole: string,
  userId?: string
) {
  return await notificationService.deleteNotification(
    notificationId,
    userRole,
    userId
  );
}

export async function clearAllUserNotifications(
  userId: string,
  userRole: string,
  userEmail?: string
) {
  return await notificationService.clearAllUserNotifications(
    userId,
    userRole,
    userEmail
  );
}

export async function getNotificationStats(
  userId: string,
  userRole: string,
  userEmail?: string
) {
  return await notificationService.getNotificationStats(
    userId,
    userRole,
    userEmail
  );
}
