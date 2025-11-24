// lib/notification-services.ts - WITH PROJECT NOTIFICATION HELPER

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

/**
 * Helper function to create project notifications
 * Centralizes all project notification logic
 */
export async function createProjectNotification(
  project: any,
  userDetails: any,
  notificationType: string,
  title: string,
  message: string,
  additionalMetadata: any = {}
): Promise<boolean> {
  try {
    console.log("════════════════════════════════════════");
    console.log("📝 Creating PROJECT notification");
    console.log("════════════════════════════════════════");

    // Validate inputs
    if (!project || !project.project_id) {
      console.error("❌ VALIDATION ERROR: Invalid project object");
      return false;
    }

    if (!userDetails || !userDetails.email) {
      console.error(
        "❌ VALIDATION ERROR: Invalid user details or missing email"
      );
      return false;
    }

    if (!title || !message) {
      console.error("❌ VALIDATION ERROR: Missing title or message");
      return false;
    }

    // Build comprehensive metadata
    const baseMetadata = {
      projectId: project.project_id,
      projectName: project.name,
      status: project.status,
      startDate: project.startDate?.toISOString(),
      endDate: project.endDate?.toISOString(),
      totalCost: project.totalCost || 0,
      location: project.location?.fullAddress || "Not specified",
      clientName: userDetails?.fullName || "Client",
      clientFirstName: userDetails?.firstName,
      clientLastName: userDetails?.lastName,
      clientEmail: userDetails?.email,
    };

    const combinedMetadata = {
      ...baseMetadata,
      ...additionalMetadata,
    };

    console.log("📋 Metadata being sent:", {
      ...combinedMetadata,
      clientEmail: combinedMetadata.clientEmail,
    });

    const notificationParams: CreateNotificationParams = {
      userId: project.userId,
      userEmail: userDetails?.email,
      targetUserRoles: ["admin"],
      feature: "projects",
      type: notificationType,
      title,
      message,
      channels: ["in_app", "email"],
      projectMetadata: combinedMetadata,
      metadata: combinedMetadata,
      relatedId: project.project_id,
      actionUrl: `/admin/admin-project?project=${project.project_id}`,
      actionLabel: "View Project",
    };

    console.log("📧 Notification params summary:", {
      userEmail: notificationParams.userEmail,
      type: notificationParams.type,
      feature: notificationParams.feature,
      channels: notificationParams.channels,
      title: notificationParams.title,
    });

    const notificationResult =
      await notificationService.createNotification(notificationParams);

    if (notificationResult && notificationResult._id) {
      console.log(`✅ ${notificationType} notification created:`, {
        notificationId: notificationResult._id,
        userEmail: notificationParams.userEmail,
        type: notificationParams.type,
      });
      return true;
    } else {
      console.error(
        `❌ ${notificationType} notification failed - no ID returned`,
        {
          result: notificationResult,
        }
      );
      return false;
    }
  } catch (notificationError) {
    console.error(
      `❌ Error creating ${notificationType} notification:`,
      notificationError
    );
    if (notificationError instanceof Error) {
      console.error("Error details:", {
        message: notificationError.message,
        stack: notificationError.stack,
      });
    }
    return false;
  }
}

class NotificationService {
  /**
   * Create a new notification (saves to database AND sends email in one function)
   */
  async createNotification(params: CreateNotificationParams) {
    await dbConnect();

    try {
      // Validate and normalize notification type
      // In the createNotification method, update this array:
      const validProjectTypes = [
        "project_created",
        "project_confirmed",
        "project_updated",
        "project_completed",
        "project_cancelled",
        "milestone_reached",
        "project_timeline_update",
        "photo_timeline_update", // ✅ Make sure this is included
        // Remove "timeline_photo_upload" if it's a duplicate
      ];
      const validAppointmentTypes = [
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_rescheduled",
        "appointment_completed",
        "inquiry_submitted",
      ];

      // Normalize the type to ensure it's valid
      let normalizedType = params.type;

      if (
        params.feature === "projects" &&
        !validProjectTypes.includes(params.type)
      ) {
        console.warn(
          `Invalid project notification type: ${params.type}, defaulting to project_updated`
        );
        normalizedType = "project_updated";
      }

      if (
        params.feature === "appointments" &&
        !validAppointmentTypes.includes(params.type)
      ) {
        console.warn(
          `Invalid appointment notification type: ${params.type}, defaulting to appointment_confirmed`
        );
        normalizedType = "appointment_confirmed";
      }

      // Set default channels to include both in_app and email
      const channels = params.channels || ["in_app", "email"];

      const notificationData: any = {
        userEmail: params.userEmail,
        feature: params.feature,
        type: normalizedType,
        title: params.title,
        message: params.message,
        isRead: false,
        channels: channels,
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

      console.log("📝 Creating notification with data:", {
        feature: notificationData.feature,
        type: notificationData.type,
        userId: notificationData.userId,
        userEmail: notificationData.userEmail,
        channels: notificationData.channels,
      });

      // Save notification to database
      const notification = new NotificationModel(notificationData);
      const savedNotification = await notification.save();

      console.log("✅ Notification saved successfully:", savedNotification._id);

      // Send email notification if email channel is enabled and user email exists
      if (channels.includes("email") && params.userEmail) {
        await this.sendEmailNotification(savedNotification);
      }

      // Revalidate relevant paths
      this.revalidatePaths(params.feature);

      return savedNotification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);

      // More detailed error logging
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      throw new Error("Failed to create notification");
    }
  }

  /**
   * Send email notification using proper email templates
   */
  private async sendEmailNotification(notification: any) {
    try {
      console.log("📧 Attempting to send email notification:", {
        notificationId: notification._id,
        userEmail: notification.userEmail,
        channels: notification.channels,
        feature: notification.feature,
        type: notification.type,
      });

      if (!notification.userEmail) {
        console.log("❌ No user email found for notification, skipping email");
        return;
      }

      if (!notification.channels?.includes("email")) {
        console.log("❌ Email channel not enabled for this notification");
        return;
      }

      let emailResult: any;

      // Use specific email templates based on feature and type
      switch (notification.feature) {
        case "appointments":
          emailResult = await this.getAppointmentEmailTemplate(notification);
          break;
        case "projects":
          emailResult = await this.getProjectEmailTemplate(notification);
          break;
        default:
          // Use generic template for other notifications
          emailResult = this.getGenericEmailTemplate(notification);
          break;
      }

      if (!emailResult) {
        console.log(
          "❌ No email template found for notification type, using generic template"
        );
        emailResult = this.getGenericEmailTemplate(notification);
      }

      // Extract subject and data from the template result
      const { subject, data } = emailResult;

      console.log("📧 Generated email template:", {
        subject,
        title: data?.title,
        hasMessage: !!data?.message,
      });

      // Generate the email template
      const emailHtml = generateEmailTemplate(data);

      console.log("📧 Sending email to:", notification.userEmail);

      // Send the email
      await sendEmail({
        to: notification.userEmail,
        subject: subject || data?.title || notification.title,
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
        userType: notification.appointmentMetadata?.userType || "guest",
        _id: { toString: () => notification.relatedId || notification._id },
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

      console.log("✅ Appointment email template generated:", {
        type: notification.type,
        hasTemplate: !!template,
        subject: template?.subject,
      });

      return template;
    } catch (error) {
      console.error("❌ Error getting appointment email template:", error);
      return this.getGenericEmailTemplate(notification);
    }
  }

  /**
   * Get email template for project notifications
   */
  private async getProjectEmailTemplate(notification: any) {
    try {
      console.log("📧 Getting project email template for notification:", {
        type: notification.type,
        projectMetadata: notification.projectMetadata,
        metadata: notification.metadata,
        userEmail: notification.userEmail,
      });

      // Use combined data from both projectMetadata and metadata with proper fallbacks
      const combinedData = {
        ...notification.projectMetadata,
        ...notification.metadata,
      };

      console.log("📧 Combined notification data:", combinedData);

      // Build project data with comprehensive fallbacks
      const mockProject = {
        name: combinedData.projectName || combinedData.name || "Your Project",
        project_id:
          combinedData.projectId || notification.relatedId || "Unknown",
        status: combinedData.status || combinedData.newStatus || "active",
        location: {
          fullAddress:
            combinedData.location ||
            combinedData.fullAddress ||
            "Project Location",
        },
        startDate: combinedData.startDate || new Date(),
        endDate: combinedData.endDate,
        totalCost: combinedData.totalCost || 0,
      };

      // Build user data with comprehensive fallbacks
      const mockUser = {
        name:
          combinedData.clientName ||
          `${combinedData.clientFirstName || ""} ${combinedData.clientLastName || ""}`.trim() ||
          notification.userEmail?.split("@")[0] ||
          "Valued Client",
        email: notification.userEmail,
      };

      console.log("📧 Final processed data for email template:", {
        project: mockProject,
        user: mockUser,
        notificationType: notification.type, // Add this for debugging
      });

      let template: any;

      // ✅ FIXED: Add proper case for photo_timeline_update
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
            "active",
            "cancelled"
          );
          break;

        case "photo_timeline_update":
          console.log(
            "📸 Using projectTimelinePhotoUpdate template for photo_timeline_update"
          );
          // Ensure all required parameters are passed
          template = EmailTemplates.projectTimelinePhotoUpdate(
            mockProject,
            mockUser,
            combinedData.updateTitle || combinedData.title || "Progress Update",
            combinedData.updateDescription ||
              combinedData.description ||
              "New photos showing current construction progress",
            combinedData.progress !== undefined
              ? combinedData.progress
              : undefined,
            combinedData.photoCount || combinedData.photosCount || 1
          );
          break;

        case "project_timeline_update":
          template = EmailTemplates.projectTimelineUpdate(
            mockProject,
            mockUser,
            combinedData.updateTitle || "Project Timeline Update",
            combinedData.updateDescription ||
              "Our team has been making progress on your project.",
            combinedData.progress
          );
          break;

        case "milestone_reached":
          template = EmailTemplates.projectMilestoneReached(
            mockProject,
            mockUser,
            combinedData.milestone || "Project Milestone",
            combinedData.progress || 50
          );
          break;

        case "project_updated":
          console.log("📝 Using projectUpdated template for project_updated");
          const previousStatus = combinedData.previousStatus;
          const newStatus = combinedData.newStatus || combinedData.status;
          const updatedFields = combinedData.updatedFields || [];

          // If status changed → use status update template
          if (previousStatus && newStatus && previousStatus !== newStatus) {
            console.log(
              "🔄 Status changed, using projectStatusUpdate template"
            );
            template = EmailTemplates.projectStatusUpdate(
              mockProject,
              mockUser,
              previousStatus,
              newStatus
            );
          }
          // If no status change, but other fields updated → use projectUpdated template
          else if (updatedFields.length > 0) {
            console.log("📋 Fields updated, using projectUpdated template");
            template = EmailTemplates.projectUpdated(
              mockProject,
              mockUser,
              updatedFields
            );
          }
          // Fallback: use projectUpdated template with empty changes
          else {
            console.log("📝 Using projectUpdated template as fallback");
            template = EmailTemplates.projectUpdated(
              mockProject,
              mockUser,
              [] // Empty changes array
            );
          }
          break;

        default:
          console.log(
            "❌ No specific template found for type:",
            notification.type
          );
          console.log("🔄 Falling back to generic template");
          return this.getGenericEmailTemplate(notification);
      }

      console.log(
        "✅ Project email template generated successfully for type:",
        notification.type
      );
      return template;
    } catch (error) {
      console.error("❌ Error getting project email template:", error);
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
    <div class="detail-value">${notification.feature} - ${notification.type.replace(/_/g, " ").toUpperCase()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Message</div>
    <div class="detail-value">${notification.message || "No additional details"}</div>
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
      subject: notification.title || "Notification Update",
      data: {
        title: notification.title || "Notification",
        message: `Dear Valued Client,<br><br>${notification.message || "You have received a new notification."}`,
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

      // SIMPLE ROLE-BASED CONDITIONS
      const conditions: any = {};

      if (currentUserRole === "admin") {
        // Admin sees ALL notifications - no filtering
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

      // Pagination
      const skip = (page - 1) * limit;

      const notifications = await NotificationModel.find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

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
