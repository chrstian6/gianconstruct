// lib/notification-services.ts - UPDATED WITH PROPER EMAIL TEMPLATE INTEGRATION
import dbConnect from "@/lib/db";
import NotificationModel from "@/models/Notification";
import User from "@/models/User";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/nodemailer";
import { EmailTemplates, generateEmailTemplate } from "./email-templates";

export interface CreateNotificationParams {
  userId?: string;
  userEmail?: string;
  targetUserIds?: string[];
  targetUserRoles?: string[];
  allowedRoles?: string[];
  createdByRole?: string;
  feature: string;
  type: string;
  title: string;
  message: string;
  channels?: string[];
  pushData?: any;
  relatedId?: string;
  appointmentMetadata?: any;
  projectMetadata?: any;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
}

export interface NotificationQuery {
  userId?: string;
  userEmail?: string;
  targetUserIds?: string[];
  targetUserRoles?: string[];
  allowedRoles?: string[];
  feature?: string;
  type?: string;
  isRead?: boolean;
  relatedId?: string;
  page?: number;
  limit?: number;
  currentUserRole?: string;
  currentUserId?: string;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams) {
    await dbConnect();

    try {
      const notificationData: any = {
        userEmail: params.userEmail,
        feature: params.feature,
        type: params.type,
        title: params.title,
        message: params.message,
        isRead: false,
        channels: params.channels || ["in_app"],
        metadata: params.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add optional fields if they exist
      if (params.userId) notificationData.userId = params.userId;
      if (params.targetUserIds)
        notificationData.targetUserIds = params.targetUserIds;
      if (params.targetUserRoles)
        notificationData.targetUserRoles = params.targetUserRoles;
      if (params.allowedRoles)
        notificationData.allowedRoles = params.allowedRoles;
      if (params.createdByRole)
        notificationData.createdByRole = params.createdByRole;
      if (params.relatedId) notificationData.relatedId = params.relatedId;
      if (params.appointmentMetadata)
        notificationData.appointmentMetadata = params.appointmentMetadata;
      if (params.projectMetadata)
        notificationData.projectMetadata = params.projectMetadata;
      if (params.actionUrl) notificationData.actionUrl = params.actionUrl;
      if (params.actionLabel) notificationData.actionLabel = params.actionLabel;
      if (params.expiresAt) notificationData.expiresAt = params.expiresAt;
      if (params.pushData) notificationData.pushData = params.pushData;

      const notification = new NotificationModel(notificationData);
      const savedNotification = await notification.save();

      // Send email notifications if enabled and email template exists
      if (params.channels?.includes("email") && params.userEmail) {
        await this.sendEmailNotification(savedNotification);
      }

      // Revalidate relevant paths
      this.revalidatePaths(params.feature);

      return savedNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  /**
   * Send email notification using proper email templates
   */
  private async sendEmailNotification(notification: any) {
    try {
      if (!notification.userEmail) {
        console.log("No user email found for notification, skipping email");
        return;
      }

      console.log("📧 Preparing to send email notification:", {
        to: notification.userEmail,
        feature: notification.feature,
        type: notification.type,
        subject: notification.title,
      });

      let emailSubject = notification.title;
      let emailTemplateData: any;

      // Use specific email templates based on feature and type
      switch (notification.feature) {
        case "appointments":
          emailTemplateData =
            await this.getAppointmentEmailTemplate(notification);
          break;

        case "projects":
          emailTemplateData = await this.getProjectEmailTemplate(notification);
          break;

        default:
          // Use generic template for other notifications
          emailTemplateData = this.getGenericEmailTemplate(notification);
          break;
      }

      if (!emailTemplateData) {
        console.log(
          "No email template found for notification type, using generic template"
        );
        emailTemplateData = this.getGenericEmailTemplate(notification);
      }

      // Generate the email template
      const emailHtml = generateEmailTemplate(emailTemplateData);

      // Send the email
      await sendEmail({
        to: notification.userEmail,
        subject: emailTemplateData.subject || emailSubject,
        html: emailHtml,
      });

      // Mark as sent in database
      await NotificationModel.findByIdAndUpdate(notification._id, {
        emailSent: true,
        emailSentAt: new Date(),
      });

      console.log(
        `✅ Email notification sent successfully to ${notification.userEmail}`
      );
    } catch (error) {
      console.error("❌ Error sending email notification:", error);
      // Don't throw error - email failure shouldn't break notification creation
    }
  }

  /**
   * Get email template for appointment notifications
   */
  private async getAppointmentEmailTemplate(notification: any) {
    try {
      // For appointment notifications, we need additional data
      // Since we don't have direct access to inquiry data here,
      // we'll create a template based on the notification metadata

      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      const formatTime = (timeString: string) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }
        );
      };

      // Create mock inquiry data from notification metadata
      const mockInquiry = {
        name: notification.userEmail?.split("@")[0] || "Client",
        email: notification.userEmail,
        design: {
          name:
            notification.appointmentMetadata?.designName ||
            "Construction Consultation",
        },
        preferredDate:
          notification.appointmentMetadata?.originalDate ||
          new Date().toISOString(),
        preferredTime:
          notification.appointmentMetadata?.originalTime || "10:00",
        meetingType: notification.appointmentMetadata?.meetingType || "virtual",
        _id: notification.relatedId || notification._id,
      };

      let template: any;

      switch (notification.type) {
        case "appointment_confirmed":
          template = EmailTemplates.appointmentConfirmed(
            mockInquiry,
            formatDate,
            formatTime
          );
          break;
        case "appointment_cancelled":
          template = EmailTemplates.appointmentCancelled(
            mockInquiry,
            formatDate,
            formatTime,
            notification.appointmentMetadata?.reason
          );
          break;
        case "appointment_rescheduled":
          template = EmailTemplates.appointmentRescheduled(
            mockInquiry,
            formatDate,
            formatTime,
            notification.appointmentMetadata?.newDate,
            notification.appointmentMetadata?.newTime,
            notification.appointmentMetadata?.notes
          );
          break;
        case "appointment_completed":
          template = EmailTemplates.appointmentCompleted(
            mockInquiry,
            formatDate,
            formatTime
          );
          break;
        case "inquiry_submitted":
          template = EmailTemplates.internalNewInquiry(
            mockInquiry,
            formatDate,
            formatTime
          );
          break;
        default:
          return this.getGenericEmailTemplate(notification);
      }

      return template;
    } catch (error) {
      console.error("Error getting appointment email template:", error);
      return this.getGenericEmailTemplate(notification);
    }
  }

  /**
   * Get email template for project notifications
   */
  private async getProjectEmailTemplate(notification: any) {
    try {
      // Create mock project and user data from notification metadata
      const mockProject = {
        name: notification.projectMetadata?.projectName || "Your Project",
        project_id:
          notification.projectMetadata?.projectId || notification.relatedId,
        status: notification.projectMetadata?.status || "active",
        location: {
          fullAddress:
            notification.projectMetadata?.location || "Project Location",
        },
        startDate: notification.projectMetadata?.startDate || new Date(),
        endDate: notification.projectMetadata?.endDate,
        totalCost: notification.projectMetadata?.totalCost || 0,
      };

      const mockUser = {
        name: notification.userEmail?.split("@")[0] || "Valued Client",
        email: notification.userEmail,
      };

      let template: any;

      switch (notification.type) {
        case "project_created":
          template = EmailTemplates.projectCreated(mockProject, mockUser);
          break;
        case "project_confirmed":
          template = EmailTemplates.projectStatusUpdate(
            mockProject,
            mockUser,
            "pending",
            "active"
          );
          break;
        case "project_completed":
          template = EmailTemplates.projectStatusUpdate(
            mockProject,
            mockUser,
            "active",
            "completed"
          );
          break;
        case "project_cancelled":
          template = EmailTemplates.projectStatusUpdate(
            mockProject,
            mockUser,
            mockProject.status,
            "cancelled"
          );
          break;
        case "milestone_reached":
          template = EmailTemplates.projectMilestoneReached(
            mockProject,
            mockUser,
            notification.projectMetadata?.milestone || "Project Milestone",
            notification.projectMetadata?.progress || 0
          );
          break;
        case "project_timeline_update":
        case "timeline_photo_upload":
          template = EmailTemplates.projectTimelineUpdate(
            mockProject,
            mockUser,
            notification.projectMetadata?.updateTitle || notification.title,
            notification.projectMetadata?.updateDescription ||
              notification.message,
            notification.projectMetadata?.progress
          );
          break;
        default:
          return this.getGenericEmailTemplate(notification);
      }

      return template;
    } catch (error) {
      console.error("Error getting project email template:", error);
      return this.getGenericEmailTemplate(notification);
    }
  }

  /**
   * Get generic email template for notifications without specific templates
   */
  private getGenericEmailTemplate(notification: any) {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Notification Type</div>
    <div class="detail-value">${notification.feature} - ${notification.type.replace("_", " ").toUpperCase()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Message</div>
    <div class="detail-value">${notification.message}</div>
  </div>
  ${
    notification.relatedId
      ? `
  <div class="detail-row">
    <div class="detail-label">Reference ID</div>
    <div class="detail-value">${notification.relatedId}</div>
  </div>
  `
      : ""
  }
</div>
    `;

    return {
      subject: notification.title,
      data: {
        title: notification.title,
        message: `Dear Valued Client,<br><br>${notification.message}`,
        details,
        nextSteps:
          "Please log in to your account for more details and to take any necessary actions.",
        showButton: !!notification.actionUrl,
        buttonText: notification.actionLabel || "View Details",
        buttonUrl: notification.actionUrl
          ? `${process.env.NEXTAUTH_URL}${notification.actionUrl}`
          : "#",
      },
    };
  }

  /**
   * Get notifications - SIMPLE ROLE-BASED FETCHING
   */
  async getNotifications(query: NotificationQuery = {}) {
    await dbConnect();

    try {
      const {
        userId,
        userEmail,
        targetUserIds,
        targetUserRoles,
        allowedRoles,
        feature,
        type,
        isRead,
        relatedId,
        currentUserRole,
        currentUserId,
        page = 1,
        limit = 50,
      } = query;

      console.log("🔔 Fetching notifications for:", {
        currentUserRole,
        currentUserId,
      });

      // SIMPLE ROLE-BASED CONDITIONS
      const conditions: any = {};

      if (currentUserRole === "admin") {
        // Admin sees ALL notifications - no filtering
        // Empty conditions = fetch everything
      } else if (currentUserRole === "user") {
        // User sees only notifications where they are the target
        conditions.$or = [
          { userId: currentUserId },
          { userEmail: userEmail },
          { targetUserIds: { $in: [currentUserId] } },
        ];
      } else {
        // Guests see nothing
        return {
          success: true,
          notifications: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 },
        };
      }

      // Apply additional filters (same for both roles)
      if (feature) conditions.feature = feature;
      if (type) conditions.type = type;
      if (isRead !== undefined) conditions.isRead = isRead;
      if (relatedId) conditions.relatedId = relatedId;

      console.log("🔔 Final query conditions:", conditions);

      // Pagination
      const skip = (page - 1) * limit;

      const notifications = await NotificationModel.find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      console.log("🔔 Found notifications:", notifications.length);

      const total = await NotificationModel.countDocuments(conditions);

      // Transform notifications
      const transformedNotifications = notifications.map((notification) => {
        return {
          _id: notification._id?.toString(),
          userId: notification.userId,
          userEmail: notification.userEmail,
          feature: notification.feature,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead || false,
          createdAt: notification.createdAt,
          timeAgo: this.getTimeAgo(notification.createdAt),
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          appointmentMetadata: notification.appointmentMetadata,
          projectMetadata: notification.projectMetadata,
          metadata: notification.metadata,
          targetUserIds: notification.targetUserIds,
          targetUserRoles: notification.targetUserRoles,
          allowedRoles: notification.allowedRoles,
          createdByRole: notification.createdByRole,
          emailSent: notification.emailSent,
          emailSentAt: notification.emailSentAt,
        };
      });

      return {
        success: true,
        notifications: transformedNotifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      return {
        success: false,
        error: "Failed to fetch notifications",
        notifications: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    currentUserRole: string,
    currentUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    await dbConnect();

    try {
      // For admin, they can mark any notification as read
      if (currentUserRole === "admin") {
        await NotificationModel.findByIdAndUpdate(
          notificationId,
          { isRead: true },
          { new: true }
        );
        return { success: true };
      }

      // For users, they can only mark their own notifications
      if (currentUserRole === "user") {
        const notification = await NotificationModel.findOne({
          _id: notificationId,
          $or: [
            { userId: currentUserId },
            { userEmail: currentUserId },
            { targetUserIds: { $in: [currentUserId] } },
          ],
        });

        if (!notification) {
          return {
            success: false,
            error: "Notification not found or access denied",
          };
        }

        await NotificationModel.findByIdAndUpdate(
          notificationId,
          { isRead: true },
          { new: true }
        );
        return { success: true };
      }

      return { success: false, error: "Invalid user role" };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: "Failed to mark notification as read" };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(
    userId: string,
    userRole: string,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    await dbConnect();

    try {
      const conditions: any = { isRead: false };

      if (userRole === "admin") {
        // Admin marks ALL notifications as read
        await NotificationModel.updateMany({ isRead: false }, { isRead: true });
      } else if (userRole === "user") {
        // User marks only their notifications as read
        conditions.$or = [
          { userId },
          { userEmail },
          { targetUserIds: { $in: [userId] } },
        ];
        await NotificationModel.updateMany(conditions, { isRead: true });
      } else {
        return { success: false, error: "Invalid user role" };
      }

      this.revalidatePaths("all");
      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        error: "Failed to mark all notifications as read",
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userRole: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    await dbConnect();

    try {
      // Admin can delete any notification
      if (userRole === "admin") {
        await NotificationModel.findByIdAndDelete(notificationId);
        return { success: true };
      }

      // Users can only delete their own notifications
      if (userRole === "user") {
        const notification = await NotificationModel.findOne({
          _id: notificationId,
          $or: [
            { userId },
            { userEmail: userId },
            { targetUserIds: { $in: [userId] } },
          ],
        });

        if (!notification) {
          return {
            success: false,
            error: "Notification not found or access denied",
          };
        }

        await NotificationModel.findByIdAndDelete(notificationId);
        return { success: true };
      }

      return { success: false, error: "Invalid user role" };
    } catch (error) {
      console.error("Error deleting notification:", error);
      return { success: false, error: "Failed to delete notification" };
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearAllUserNotifications(
    userId: string,
    userRole: string,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    await dbConnect();

    try {
      if (userRole === "admin") {
        // Admin clears ALL notifications
        await NotificationModel.deleteMany({});
      } else if (userRole === "user") {
        // User clears only their notifications
        const conditions = {
          $or: [
            { userId },
            { userEmail },
            { targetUserIds: { $in: [userId] } },
          ],
        };
        await NotificationModel.deleteMany(conditions);
      } else {
        return { success: false, error: "Invalid user role" };
      }

      this.revalidatePaths("all");
      return { success: true };
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      return { success: false, error: "Failed to clear all notifications" };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    userId: string,
    userRole: string,
    userEmail?: string
  ) {
    await dbConnect();

    try {
      let conditions: any = {};

      if (userRole === "admin") {
        // Admin gets stats for ALL notifications
        // No conditions needed
      } else if (userRole === "user") {
        // User gets stats only for their notifications
        conditions = {
          $or: [
            { userId },
            { userEmail },
            { targetUserIds: { $in: [userId] } },
          ],
        };
      } else {
        return {
          success: false,
          error: "Invalid user role",
          stats: { total: 0, unread: 0, read: 0, byFeature: {} },
        };
      }

      const total = await NotificationModel.countDocuments(conditions);
      const unread = await NotificationModel.countDocuments({
        ...conditions,
        isRead: false,
      });

      const featureStats = await NotificationModel.aggregate([
        { $match: conditions },
        { $group: { _id: "$feature", count: { $sum: 1 } } },
      ]);

      const byFeature = featureStats.reduce(
        (acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        success: true,
        stats: {
          total,
          unread,
          read: total - unread,
          byFeature,
        },
      };
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      return {
        success: false,
        error: "Failed to fetch notification statistics",
        stats: { total: 0, unread: 0, read: 0, byFeature: {} },
      };
    }
  }

  /**
   * Revalidate Next.js paths based on feature
   */
  private revalidatePaths(feature: string | "all") {
    try {
      const paths = ["/admin/notifications", "/user/userdashboard"];

      if (feature === "all" || feature === "appointments") {
        paths.push("/admin/appointments");
        paths.push("/user/appointments");
      }

      if (feature === "all" || feature === "projects") {
        paths.push("/admin/admin-project");
        paths.push("/user/projects");
      }

      paths.forEach((path) => {
        revalidatePath(path);
      });
    } catch (error) {
      console.error("Error revalidating paths:", error);
    }
  }

  /**
   * Helper function for time ago
   */
  private getTimeAgo(date: Date): string {
    if (!date) return "Recently";

    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return new Date(date).toLocaleDateString();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
