// lib/notification-services.ts - UPDATED WITH PROPER notificationType HANDLING
import dbConnect from "@/lib/db";
import NotificationModel from "@/models/Notification";
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
  pushData?: Record<string, unknown>;
  relatedId?: string;
  appointmentMetadata?: Record<string, unknown>;
  projectMetadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>; // This accepts any Record<string, unknown>
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  notificationType?: "admin" | "user"; // Added explicit notificationType parameter
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
  currentUserEmail?: string;
  notificationType?: "admin" | "user";
}

interface ProjectData {
  project_id: string;
  name?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  totalCost?: number;
  location?: {
    fullAddress?: string;
  };
  userId?: string;
}

interface UserDetails {
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

// FIXED: Add index signature to PDCMetadata
interface PDCMetadata {
  pdcId?: string;
  checkNumber?: string;
  supplier?: string;
  amount?: number;
  checkDate?: string;
  formattedAmount?: string;
  formattedDate?: string;
  itemCount?: number;
  daysUntilCheck?: number;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  issuedAt?: string;
  cancelledAt?: string;
  action?: string;
  totalPDCs?: number;
  totalAmount?: number;
  issuedPDCs?: number;
  issuedAmount?: number;
  pendingPDCs?: number;
  pendingAmount?: number;
  cancelledPDCs?: number;
  cancelledAmount?: number;

  // Add index signature to fix TypeScript error
  [key: string]: unknown;
}

// Add Appointment Data Interface
interface AppointmentData {
  inquiryId?: string;
  appointmentId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
  designName?: string;
  originalDate?: string;
  originalTime?: string;
  newDate?: string;
  newTime?: string;
  meetingType?: string;
  userType?: string;
  reason?: string;
  notes?: string;
}

/**
 * Helper function to create appointment notifications
 */
export async function createAppointmentNotification(
  appointment: AppointmentData,
  notificationType: string,
  title: string,
  message: string,
  additionalMetadata: Record<string, unknown> = {}
): Promise<boolean> {
  try {
    console.log("════════════════════════════════════════");
    console.log("📅 Creating APPOINTMENT notification");
    console.log("════════════════════════════════════════");

    // Validate inputs
    if (!appointment) {
      console.error("❌ VALIDATION ERROR: Invalid appointment object");
      return false;
    }

    if (!appointment.userEmail && !appointment.userId) {
      console.error("❌ VALIDATION ERROR: Missing user email or ID");
      return false;
    }

    if (!title || !message) {
      console.error("❌ VALIDATION ERROR: Missing title or message");
      return false;
    }

    // Build comprehensive metadata
    const baseMetadata: Record<string, unknown> = {
      inquiryId: appointment.inquiryId,
      appointmentId: appointment.appointmentId,
      originalDate: appointment.originalDate,
      originalTime: appointment.originalTime,
      newDate: appointment.newDate,
      newTime: appointment.newTime,
      meetingType: appointment.meetingType,
      userType: appointment.userType,
      reason: appointment.reason,
      notes: appointment.notes,
      userName: appointment.userName,
      userFirstName: appointment.userFirstName,
      userLastName: appointment.userLastName,
      userEmail: appointment.userEmail,
      designName: appointment.designName,
    };

    const combinedMetadata = {
      ...baseMetadata,
      ...additionalMetadata,
    };

    console.log("📋 Appointment metadata:", {
      userId: appointment.userId,
      userEmail: appointment.userEmail,
      type: notificationType,
    });

    // CRITICAL: Create TWO notifications - one for admin and one for user
    const results = [];

    // 1. Create ADMIN notification (targetUserRoles: ["admin"])
    const adminNotificationParams: CreateNotificationParams = {
      targetUserRoles: ["admin"],
      feature: "appointments",
      type: notificationType,
      title: `Appointment: ${title}`,
      message: `[Admin] ${message}`,
      channels: ["in_app", "email"], // Include in_app for admin too!
      appointmentMetadata: combinedMetadata,
      metadata: combinedMetadata,
      relatedId: appointment.inquiryId || appointment.appointmentId,
      actionUrl: `/admin/appointments`,
      actionLabel: "View Appointment",
      createdByRole: "admin", // CHANGED: Use "admin" instead of "system"
      notificationType: "admin", // Explicitly set notificationType to "admin"
    };

    console.log("📧 ADMIN Appointment notification params:", {
      targetUserRoles: adminNotificationParams.targetUserRoles,
      type: adminNotificationParams.type,
      channels: adminNotificationParams.channels,
      createdByRole: adminNotificationParams.createdByRole,
      notificationType: adminNotificationParams.notificationType, // Debug
    });

    const adminNotificationResult =
      await notificationService.createNotification(adminNotificationParams);
    results.push(adminNotificationResult);

    // 2. Create USER notification (directly to the user)
    const userNotificationParams: CreateNotificationParams = {
      userId: appointment.userId,
      userEmail: appointment.userEmail,
      feature: "appointments",
      type: notificationType,
      title: title,
      message: message,
      channels: ["in_app", "email"], // CRITICAL: Include in_app channel!
      appointmentMetadata: combinedMetadata,
      metadata: combinedMetadata,
      relatedId: appointment.inquiryId || appointment.appointmentId,
      actionUrl: `/user/appointments`,
      actionLabel: "View My Appointment",
      createdByRole: "admin", // CHANGED: Use "admin" instead of "system"
      notificationType: "user", // Explicitly set notificationType to "user"
    };

    console.log("📧 USER Appointment notification params:", {
      userId: userNotificationParams.userId,
      userEmail: userNotificationParams.userEmail,
      type: userNotificationParams.type,
      channels: userNotificationParams.channels,
      createdByRole: userNotificationParams.createdByRole,
      notificationType: userNotificationParams.notificationType, // Debug
    });

    const userNotificationResult = await notificationService.createNotification(
      userNotificationParams
    );
    results.push(userNotificationResult);

    // Check if both notifications were created successfully
    const successCount = results.filter(
      (result) => result && result._id
    ).length;
    console.log(`✅ Created ${successCount}/2 appointment notifications`);

    return successCount > 0;
  } catch (notificationError) {
    console.error(
      `❌ Error creating appointment notification:`,
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

/**
 * Helper function to create project notifications
 */
export async function createProjectNotification(
  project: ProjectData,
  userDetails: UserDetails,
  notificationType: string,
  title: string,
  message: string,
  additionalMetadata: Record<string, unknown> = {}
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
    const baseMetadata: Record<string, unknown> = {
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

    console.log("📋 Project metadata:", {
      projectId: project.project_id,
      userId: project.userId,
      userEmail: userDetails.email,
    });

    // CRITICAL: Create TWO notifications - one for admin and one for user
    const results = [];

    // 1. Create ADMIN notification (targetUserRoles: ["admin"])
    const adminNotificationParams: CreateNotificationParams = {
      targetUserRoles: ["admin"],
      feature: "projects",
      type: notificationType,
      title: `Project: ${title}`,
      message: `[Admin] ${message}`,
      channels: ["in_app", "email"],
      projectMetadata: combinedMetadata,
      metadata: combinedMetadata,
      relatedId: project.project_id,
      actionUrl: `/admin/admin-project?project=${project.project_id}`,
      actionLabel: "View Project",
      createdByRole: "admin", // CHANGED: Use "admin" instead of "system"
      notificationType: "admin", // Explicitly set notificationType to "admin"
    };

    console.log("📧 ADMIN Project notification params:", {
      targetUserRoles: adminNotificationParams.targetUserRoles,
      type: adminNotificationParams.type,
      channels: adminNotificationParams.channels,
      notificationType: adminNotificationParams.notificationType,
    });

    const adminNotificationResult =
      await notificationService.createNotification(adminNotificationParams);
    results.push(adminNotificationResult);

    // 2. Create USER notification (directly to the user)
    const userNotificationParams: CreateNotificationParams = {
      userId: project.userId,
      userEmail: userDetails?.email,
      feature: "projects",
      type: notificationType,
      title: title,
      message: message,
      channels: ["in_app", "email"],
      projectMetadata: combinedMetadata,
      metadata: combinedMetadata,
      relatedId: project.project_id,
      actionUrl: `/user/projects?project=${project.project_id}`,
      actionLabel: "View My Project",
      createdByRole: "admin", // CHANGED: Use "admin" instead of "system"
      notificationType: "user", // Explicitly set notificationType to "user"
    };

    console.log("📧 USER Project notification params:", {
      userId: userNotificationParams.userId,
      userEmail: userNotificationParams.userEmail,
      type: userNotificationParams.type,
      channels: userNotificationParams.channels,
      notificationType: userNotificationParams.notificationType,
    });

    const userNotificationResult = await notificationService.createNotification(
      userNotificationParams
    );
    results.push(userNotificationResult);

    // Check if both notifications were created successfully
    const successCount = results.filter(
      (result) => result && result._id
    ).length;
    console.log(`✅ Created ${successCount}/2 project notifications`);

    return successCount > 0;
  } catch (notificationError) {
    console.error(`❌ Error creating project notification:`, notificationError);
    return false;
  }
}

/**
 * Helper function to create PDC notifications (admin only)
 */
export async function createPDCNotification(
  pdcData: PDCMetadata,
  notificationType: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    console.log("════════════════════════════════════════");
    console.log("💰 Creating PDC notification");
    console.log("════════════════════════════════════════");

    // Validate inputs
    if (!pdcData) {
      console.error("❌ VALIDATION ERROR: Invalid PDC data");
      return false;
    }

    if (!title || !message) {
      console.error("❌ VALIDATION ERROR: Missing title or message");
      return false;
    }

    // PDC notifications are ADMIN ONLY
    const pdcNotificationParams: CreateNotificationParams = {
      targetUserRoles: ["admin"],
      feature: "pdc",
      type: notificationType,
      title: title,
      message: message,
      channels: ["in_app", "email"], // Include in_app for PDC notifications
      metadata: pdcData as Record<string, unknown>, // FIX: Cast to Record<string, unknown>
      relatedId: pdcData.checkNumber || pdcData.pdcId,
      actionUrl: `/admin/pdc${pdcData.checkNumber ? `?check=${pdcData.checkNumber}` : ""}`,
      actionLabel: "View PDC",
      createdByRole: "system",
      notificationType: "admin", // Explicitly set notificationType to "admin"
    };

    console.log("📧 PDC notification params:", {
      targetUserRoles: pdcNotificationParams.targetUserRoles,
      type: pdcNotificationParams.type,
      channels: pdcNotificationParams.channels,
      notificationType: pdcNotificationParams.notificationType,
    });

    const result = await notificationService.createNotification(
      pdcNotificationParams
    );

    console.log(
      `✅ Created PDC notification: ${result ? "Success" : "Failed"}`
    );
    return !!result;
  } catch (notificationError) {
    console.error(`❌ Error creating PDC notification:`, notificationError);
    return false;
  }
}

interface NotificationDocument {
  _id: unknown;
  userEmail?: string;
  channels?: string[];
  feature: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  appointmentMetadata?: Record<string, unknown>;
  projectMetadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  updatedAt?: Date;
  isRead?: boolean;
  emailSent?: boolean;
  emailSentAt?: Date;
  userId?: string;
  targetUserIds?: string[];
  targetUserRoles?: string[];
  allowedRoles?: string[];
  createdByRole?: string;
  pushData?: Record<string, unknown>;
  expiresAt?: Date;
  notificationType?: "admin" | "user";
}

interface EmailTemplateResult {
  subject: string;
  data: {
    title: string;
    message: string;
    details?: string;
    nextSteps?: string;
    showButton?: boolean;
    buttonText?: string;
    buttonUrl?: string;
  };
}

interface InquiryData {
  name: string;
  email: string;
  design: {
    name: string;
  };
  preferredDate: string;
  preferredTime: string;
  meetingType: string;
  userType: string;
  _id: {
    toString: () => string;
  };
}

interface ProjectTemplateData {
  name: string;
  project_id: string;
  status: string;
  location: {
    fullAddress: string;
  };
  startDate: Date | string;
  endDate?: Date | string;
  totalCost?: number;
}

interface UserTemplateData {
  name: string;
  email: string;
}

class NotificationService {
  /**
   * Create a new notification (saves to database AND sends email)
   */
  async createNotification(params: CreateNotificationParams) {
    await dbConnect();

    try {
      console.log("📝 Creating notification with params:", {
        feature: params.feature,
        type: params.type,
        userId: params.userId,
        userEmail: params.userEmail,
        targetUserRoles: params.targetUserRoles,
        channels: params.channels,
        notificationType: params.notificationType, // Log notificationType
      });

      // Validate notification type
      const validProjectTypes = [
        "project_created",
        "project_confirmed",
        "project_updated",
        "project_completed",
        "project_cancelled",
        "milestone_reached",
        "project_timeline_update",
        "photo_timeline_update",
        "invoice_sent",
        "invoice_paid",
        "payment_received",
      ];
      const validAppointmentTypes = [
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_rescheduled",
        "appointment_completed",
        "inquiry_submitted",
      ];
      const validPDCTypes = [
        "pdc_created",
        "pdc_issued",
        "pdc_cancelled",
        "pdc_status_updated",
        "pdc_stats_summary",
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

      if (params.feature === "pdc" && !validPDCTypes.includes(params.type)) {
        console.warn(
          `Invalid PDC notification type: ${params.type}, defaulting to pdc_created`
        );
        normalizedType = "pdc_created";
      }

      // Set default channels to include both in_app and email
      const channels = params.channels || ["in_app", "email"];

      // CRITICAL: Ensure in_app channel is always included unless explicitly excluded
      if (!channels.includes("in_app")) {
        channels.push("in_app");
      }

      // Determine notification type (admin vs user)
      // Priority: 1. Explicit parameter, 2. targetUserRoles-based, 3. user-based
      let notificationType: "admin" | "user" = "user";

      // If explicitly provided, use it
      if (params.notificationType) {
        notificationType = params.notificationType;
      }
      // Otherwise determine based on targetUserRoles
      else if (params.targetUserRoles?.includes("admin")) {
        notificationType = "admin";
      }
      // Otherwise check if it's a user notification
      else if (params.userId || params.userEmail) {
        notificationType = "user";
      }

      console.log("🔍 Determined notificationType:", notificationType);

      const notificationData: Partial<NotificationDocument> = {
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
        notificationType: notificationType, // Set notificationType field
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

      console.log("💾 Saving notification to database:", {
        feature: notificationData.feature,
        type: notificationData.type,
        userId: notificationData.userId,
        userEmail: notificationData.userEmail,
        channels: notificationData.channels,
        notificationType: notificationData.notificationType,
      });

      // Save notification to database
      const notification = new NotificationModel(notificationData);
      const savedNotification = await notification.save();

      console.log("✅ Notification saved successfully to database:", {
        id: savedNotification._id,
        feature: savedNotification.feature,
        type: savedNotification.type,
        userId: savedNotification.userId,
        userEmail: savedNotification.userEmail,
        channels: savedNotification.channels,
        notificationType: savedNotification.notificationType,
      });

      // Send email notification if email channel is enabled
      if (channels.includes("email")) {
        await this.sendEmailNotification(savedNotification);
      }

      // Revalidate relevant paths
      this.revalidatePaths(params.feature);

      return savedNotification;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
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
  private async sendEmailNotification(notification: NotificationDocument) {
    try {
      console.log("📧 Attempting to send email notification:", {
        notificationId: notification._id,
        userEmail: notification.userEmail,
        userId: notification.userId,
        channels: notification.channels,
        feature: notification.feature,
        type: notification.type,
        notificationType: notification.notificationType,
      });

      if (!notification.channels?.includes("email")) {
        console.log("❌ Email channel not enabled for this notification");
        return;
      }

      let emailResult: EmailTemplateResult | null = null;
      let recipientEmail = notification.userEmail;

      // CRITICAL: Determine recipient email based on notificationType
      if (notification.notificationType === "admin") {
        // Admin notifications ALWAYS go to COMPANY_EMAIL
        recipientEmail = process.env.COMPANY_EMAIL;
        console.log(
          "🎯 Admin notification detected, using COMPANY_EMAIL:",
          recipientEmail
        );

        if (!recipientEmail) {
          console.error("❌ COMPANY_EMAIL not set in environment variables");
          return;
        }
      } else if (notification.notificationType === "user") {
        // User notifications go to the user's email
        if (!recipientEmail) {
          console.log(
            "❌ No recipient email found for user notification, skipping email"
          );
          return;
        }
        console.log(
          "👤 User notification detected, using user email:",
          recipientEmail
        );
      } else {
        console.log("❌ Unknown notification type, skipping email");
        return;
      }

      // Use specific email templates based on feature and type
      switch (notification.feature) {
        case "appointments":
          emailResult = await this.getAppointmentEmailTemplate(notification);
          break;
        case "projects":
          emailResult = await this.getProjectEmailTemplate(notification);
          break;
        case "pdc":
          emailResult = await this.getPDCEmailTemplate(notification);
          break;
        default:
          emailResult = this.getGenericEmailTemplate(notification);
          break;
      }

      if (!emailResult) {
        emailResult = this.getGenericEmailTemplate(notification);
      }

      const { subject, data } = emailResult;

      console.log("📧 Generated email template:", {
        subject,
        recipient: recipientEmail,
        notificationType: notification.notificationType,
        isAdminNotification: notification.notificationType === "admin",
      });

      // Generate the email template
      const emailHtml = generateEmailTemplate(data);

      console.log("📧 Sending email to:", recipientEmail);

      // Send the email
      await sendEmail({
        to: recipientEmail,
        subject: subject || data?.title || notification.title,
        html: emailHtml,
      });

      // Mark as sent in database
      await NotificationModel.findByIdAndUpdate(notification._id, {
        emailSent: true,
        emailSentAt: new Date(),
      });

      console.log(`✅ Email sent successfully to ${recipientEmail}`);
    } catch (error) {
      console.error("❌ Error sending email notification:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
    }
  }

  /**
   * Get email template for appointment notifications
   */
  private async getAppointmentEmailTemplate(
    notification: NotificationDocument
  ): Promise<EmailTemplateResult> {
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
      const metadata =
        notification.appointmentMetadata || notification.metadata || {};
      const mockInquiry: InquiryData = {
        name: notification.userEmail?.split("@")[0] || "Client",
        email: notification.userEmail || "",
        design: {
          name: (metadata.designName as string) || "Construction Consultation",
        },
        preferredDate:
          (metadata.originalDate as string) || new Date().toISOString(),
        preferredTime: (metadata.originalTime as string) || "10:00",
        meetingType: (metadata.meetingType as string) || "virtual",
        userType: (metadata.userType as string) || "guest",
        _id: {
          toString: () => notification.relatedId || String(notification._id),
        },
      };

      let template: EmailTemplateResult | null = null;

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
            metadata.reason as string
          );
          break;
        case "appointment_rescheduled":
          template = EmailTemplates.appointmentRescheduled(
            mockInquiry,
            formatDate,
            formatTime,
            metadata.newDate as string,
            metadata.newTime as string,
            metadata.notes as string
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

      return template || this.getGenericEmailTemplate(notification);
    } catch (error) {
      console.error("❌ Error getting appointment email template:", error);
      return this.getGenericEmailTemplate(notification);
    }
  }

  /**
   * Get email template for project notifications
   */
  private async getProjectEmailTemplate(
    notification: NotificationDocument
  ): Promise<EmailTemplateResult> {
    try {
      console.log("📧 Getting project email template for:", {
        type: notification.type,
        notificationType: notification.notificationType,
      });

      // Use combined data from both projectMetadata and metadata
      const combinedData: Record<string, unknown> = {
        ...notification.projectMetadata,
        ...notification.metadata,
      };

      // Build project data
      const mockProject: ProjectTemplateData = {
        name: (combinedData.projectName ||
          combinedData.name ||
          "Your Project") as string,
        project_id: (combinedData.projectId ||
          notification.relatedId ||
          "Unknown") as string,
        status: (combinedData.status ||
          combinedData.newStatus ||
          "active") as string,
        location: {
          fullAddress: (combinedData.location ||
            combinedData.fullAddress ||
            "Project Location") as string,
        },
        startDate: (combinedData.startDate as Date) || new Date(),
        endDate: combinedData.endDate as Date,
        totalCost: (combinedData.totalCost as number) || 0,
      };

      // Build user data
      const mockUser: UserTemplateData = {
        name:
          (combinedData.clientName as string) ||
          `${combinedData.clientFirstName || ""} ${combinedData.clientLastName || ""}`.trim() ||
          notification.userEmail?.split("@")[0] ||
          "Valued Client",
        email: notification.userEmail || "",
      };

      let template: EmailTemplateResult | null = null;
      const isAdminNotification = notification.notificationType === "admin";

      switch (notification.type) {
        case "project_created":
          if (isAdminNotification) {
            template = EmailTemplates.internalNewProject(mockProject, mockUser);
          } else {
            template = EmailTemplates.projectCreated(mockProject, mockUser);
          }
          break;

        case "project_confirmed":
          if (isAdminNotification) {
            template = EmailTemplates.projectConfirmedAdmin(
              mockProject,
              mockUser,
              combinedData.downpaymentAmount as number,
              combinedData.remainingBalance as number,
              combinedData.transactionId as string,
              combinedData.paymentDeadline as string
            );
          } else {
            template = EmailTemplates.projectConfirmed(
              mockProject,
              mockUser,
              combinedData.downpaymentAmount as number,
              combinedData.remainingBalance as number,
              combinedData.transactionId as string,
              combinedData.paymentDeadline as string
            );
          }
          break;

        case "payment_received":
          template = EmailTemplates.paymentReceived(
            mockProject,
            mockUser,
            combinedData.transactionId as string,
            combinedData.amount as number,
            combinedData.paidDate as string
          );
          break;

        case "project_completed":
          if (isAdminNotification) {
            template = EmailTemplates.internalProjectCompleted(
              mockProject,
              mockUser
            );
          } else {
            template = EmailTemplates.projectStatusUpdate(
              mockProject,
              mockUser,
              "active",
              "completed"
            );
          }
          break;

        case "project_cancelled":
          if (isAdminNotification) {
            template = EmailTemplates.internalProjectCancelled(
              mockProject,
              mockUser
            );
          } else {
            template = EmailTemplates.projectStatusUpdate(
              mockProject,
              mockUser,
              "active",
              "cancelled"
            );
          }
          break;

        case "photo_timeline_update":
          template = EmailTemplates.projectTimelinePhotoUpdate(
            mockProject,
            mockUser,
            (combinedData.updateTitle ||
              combinedData.title ||
              "Progress Update") as string,
            (combinedData.updateDescription ||
              combinedData.description ||
              "New photos showing current construction progress") as string,
            combinedData.progress !== undefined
              ? (combinedData.progress as number)
              : undefined,
            (combinedData.photoCount || combinedData.photosCount || 1) as number
          );
          break;

        case "project_timeline_update":
          template = EmailTemplates.projectTimelineUpdate(
            mockProject,
            mockUser,
            (combinedData.updateTitle || "Project Timeline Update") as string,
            (combinedData.updateDescription ||
              "Our team has been making progress on your project.") as string,
            combinedData.progress as number
          );
          break;

        case "invoice_sent":
          template = EmailTemplates.invoiceSent(
            mockProject,
            mockUser,
            combinedData.transactionId as string,
            combinedData.amount as number,
            combinedData.dueDate as string,
            combinedData.paymentType as string
          );
          break;

        case "invoice_paid":
          template = EmailTemplates.invoicePaid(
            mockProject,
            mockUser,
            combinedData.transactionId as string,
            combinedData.amount as number,
            combinedData.paidDate as string
          );
          break;

        case "milestone_reached":
          template = EmailTemplates.projectMilestoneReached(
            mockProject,
            mockUser,
            (combinedData.milestone || "Project Milestone") as string,
            (combinedData.progress as number) || 50
          );
          break;

        case "project_updated":
          const previousStatus = combinedData.previousStatus as string;
          const newStatus = (combinedData.newStatus ||
            combinedData.status) as string;
          const updatedFields = (combinedData.updatedFields as string[]) || [];

          if (previousStatus && newStatus && previousStatus !== newStatus) {
            template = EmailTemplates.projectStatusUpdate(
              mockProject,
              mockUser,
              previousStatus,
              newStatus
            );
          } else if (updatedFields.length > 0) {
            template = EmailTemplates.projectUpdated(
              mockProject,
              mockUser,
              updatedFields
            );
          } else {
            template = EmailTemplates.projectUpdated(mockProject, mockUser, []);
          }
          break;

        default:
          return this.getGenericEmailTemplate(notification);
      }

      return template || this.getGenericEmailTemplate(notification);
    } catch (error) {
      console.error("❌ Error getting project email template:", error);
      return this.getGenericEmailTemplate(notification);
    }
  }

  /**
   * Get email template for PDC notifications
   */
  private async getPDCEmailTemplate(
    notification: NotificationDocument
  ): Promise<EmailTemplateResult> {
    try {
      const metadata = (notification.metadata || {}) as PDCMetadata;
      let template: EmailTemplateResult | null = null;

      const isAdminNotification = notification.notificationType === "admin";

      // PDC notifications are admin-only
      if (!isAdminNotification) {
        console.log(
          "⚠️ PDC notification is not for admin, using generic template"
        );
        return this.getGenericEmailTemplate(notification);
      }

      switch (notification.type) {
        case "pdc_created":
          template = this.getPDCCreatedTemplate(metadata);
          break;
        case "pdc_issued":
          template = this.getPDCIssuedTemplate(metadata);
          break;
        case "pdc_status_updated":
          template = this.getPDCStatusUpdateTemplate(metadata);
          break;
        case "pdc_stats_summary":
          template = this.getPDCStatsTemplate(metadata);
          break;
        case "pdc_cancelled":
          template = this.getPDCCancelledTemplate(metadata);
          break;
        default:
          return this.getGenericEmailTemplate(notification);
      }

      return template || this.getGenericEmailTemplate(notification);
    } catch (error) {
      console.error("❌ Error getting PDC email template:", error);
      return this.getGenericEmailTemplate(notification);
    }
  }

  /**
   * PDC Created Email Template
   */
  private getPDCCreatedTemplate(metadata: PDCMetadata): EmailTemplateResult {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const daysUntilCheck = metadata.daysUntilCheck || 0;
    const daysMessage =
      daysUntilCheck > 0
        ? `in ${daysUntilCheck} day${daysUntilCheck > 1 ? "s" : ""}`
        : "today";

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Check Date</div>
    <div class="detail-value">${formatDate(metadata.checkDate || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value">${(metadata.status || "pending").charAt(0).toUpperCase() + (metadata.status || "pending").slice(1)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Items</div>
    <div class="detail-value">${metadata.itemCount || 0} item${(metadata.itemCount || 0) > 1 ? "s" : ""}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Time to Issue</div>
    <div class="detail-value">${daysMessage}</div>
  </div>
</div>
    `;

    return {
      subject: `New PDC Created: ${metadata.checkNumber || "Unknown"} - ${formatCurrency(metadata.amount || 0)}`,
      data: {
        title: "New PDC Created",
        message: `A new Post-Dated Check has been created for <strong>${metadata.supplier || "Supplier"}</strong>.`,
        details,
        nextSteps: `
<strong>Next Steps:</strong><br>
1. Review the PDC details<br>
2. Verify the check amount and date<br>
3. Monitor for auto-issuing on check date<br>
4. Keep track of inventory items linked to this PDC
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
      },
    };
  }

  /**
   * PDC Issued Email Template
   */
  private getPDCIssuedTemplate(metadata: PDCMetadata): EmailTemplateResult {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Check Date</div>
    <div class="detail-value">${formatDate(metadata.checkDate || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Issued On</div>
    <div class="detail-value">${formatDateTime(metadata.issuedAt || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Items Covered</div>
    <div class="detail-value">${metadata.itemCount || 0} inventory item${(metadata.itemCount || 0) > 1 ? "s" : ""}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span style="color: #059669; font-weight: 600;">Issued</span></div>
  </div>
</div>
    `;

    return {
      subject: `PDC Issued: ${metadata.checkNumber || "Unknown"} - ${formatCurrency(metadata.amount || 0)}`,
      data: {
        title: "PDC Has Been Issued",
        message: `Post-Dated Check <strong>${metadata.checkNumber || "Unknown"}</strong> has been issued to <strong>${metadata.supplier || "Supplier"}</strong>.`,
        details,
        nextSteps: `
<strong>Next Steps:</strong><br>
1. Track payment receipt from supplier<br>
2. Update inventory records if needed<br>
3. File PDC record for accounting<br>
4. Monitor for any issues with the check
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
      },
    };
  }

  /**
   * PDC Status Update Email Template
   */
  private getPDCStatusUpdateTemplate(
    metadata: PDCMetadata
  ): EmailTemplateResult {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Previous Status</div>
    <div class="detail-value">${(metadata.oldStatus || "unknown").charAt(0).toUpperCase() + (metadata.oldStatus || "unknown").slice(1)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">New Status</div>
    <div class="detail-value"><span style="color: #2563eb; font-weight: 600;">${(metadata.newStatus || "unknown").charAt(0).toUpperCase() + (metadata.newStatus || "unknown").slice(1)}</span></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Updated</div>
    <div class="detail-value">${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</div>
  </div>
</div>
    `;

    return {
      subject: `PDC Status Update: ${metadata.checkNumber || "Unknown"} - ${metadata.oldStatus || "unknown"} → ${metadata.newStatus || "unknown"}`,
      data: {
        title: "PDC Status Updated",
        message: `Post-Dated Check <strong>${metadata.checkNumber || "Unknown"}</strong> status has been updated.`,
        details,
        nextSteps: `
<strong>Action Required:</strong><br>
1. Review the status change<br>
2. Update financial records if needed<br>
3. Notify relevant team members<br>
4. Take any necessary follow-up actions
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
      },
    };
  }

  /**
   * PDC Statistics Email Template
   */
  private getPDCStatsTemplate(metadata: PDCMetadata): EmailTemplateResult {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Total PDCs</div>
    <div class="detail-value">${metadata.totalPDCs || 0}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Total Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.totalAmount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Issued PDCs</div>
    <div class="detail-value">${metadata.issuedPDCs || 0} (${formatCurrency(metadata.issuedAmount || 0)})</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Pending PDCs</div>
    <div class="detail-value">${metadata.pendingPDCs || 0} (${formatCurrency(metadata.pendingAmount || 0)})</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Cancelled PDCs</div>
    <div class="detail-value">${metadata.cancelledPDCs || 0} (${formatCurrency(metadata.cancelledAmount || 0)})</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Report Period</div>
    <div class="detail-value">${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</div>
  </div>
</div>
    `;

    return {
      subject: `PDC Statistics Summary - ${metadata.totalPDCs || 0} PDCs (${formatCurrency(metadata.totalAmount || 0)})`,
      data: {
        title: "PDC Statistics Summary",
        message: `Summary of Post-Dated Checks for the period.`,
        details,
        nextSteps: `
<strong>Insights:</strong><br>
• ${metadata.issuedPDCs || 0} issued checks awaiting payment<br>
• ${metadata.pendingPDCs || 0} pending checks for future dates<br>
• Monitor upcoming check dates for auto-issuing<br>
• Review supplier payment patterns
      `,
        showButton: true,
        buttonText: "View PDC Dashboard",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc`,
      },
    };
  }

  /**
   * PDC Cancelled Email Template
   */
  private getPDCCancelledTemplate(metadata: PDCMetadata): EmailTemplateResult {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Cancelled On</div>
    <div class="detail-value">${formatDateTime(metadata.cancelledAt || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span style="color: #dc2626; font-weight: 600;">Cancelled</span></div>
  </div>
</div>
    `;

    return {
      subject: `PDC Cancelled: ${metadata.checkNumber || "Unknown"} - ${formatCurrency(metadata.amount || 0)}`,
      data: {
        title: "PDC Cancelled",
        message: `Post-Dated Check <strong>${metadata.checkNumber || "Unknown"}</strong> has been cancelled.`,
        details,
        nextSteps: `
<strong>Action Required:</strong><br>
1. Update financial records<br>
2. Remove from pending payments<br>
3. Notify relevant departments<br>
4. Review reason for cancellation
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
      },
    };
  }

  /**
   * Get generic email template for notifications without specific templates
   */
  private getGenericEmailTemplate(
    notification: NotificationDocument
  ): EmailTemplateResult {
    const isAdminNotification = notification.notificationType === "admin";

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
  ${
    notification.notificationType
      ? `
  <div class="detail-row">
    <div class="detail-label">Recipient Type</div>
    <div class="detail-value">${notification.notificationType.toUpperCase()}</div>
  </div>
  `
      : ""
  }
</div>
  `;

    const subject = isAdminNotification
      ? `🔔 ${notification.title || "Admin Notification"}`
      : notification.title || "Notification Update";

    const message = isAdminNotification
      ? `Dear Admin Team,<br><br>${notification.message || "You have received a new system notification."}`
      : `Dear Valued Client,<br><br>${notification.message || "You have received a new notification."}`;

    const nextSteps = isAdminNotification
      ? "Please review this notification and take appropriate action."
      : "Please log in to your account for more details and to take any necessary actions.";

    return {
      subject,
      data: {
        title: isAdminNotification
          ? `🔔 ${notification.title || "Admin Notification"}`
          : notification.title || "Notification",
        message,
        details,
        nextSteps,
        showButton: !!notification.actionUrl,
        buttonText: notification.actionLabel || "View Details",
        buttonUrl: notification.actionUrl
          ? `${process.env.NEXTAUTH_URL}${notification.actionUrl}`
          : "#",
      },
    };
  }

  /**
   * Get notifications - FIXED: Proper filtering by user ID and notification type
   */
  async getNotifications(query: NotificationQuery = {}) {
    await dbConnect();

    try {
      const {
        userEmail,
        userId,
        feature,
        type,
        isRead,
        relatedId,
        currentUserRole,
        currentUserId,
        currentUserEmail,
        page = 1,
        limit = 50,
        notificationType,
      } = query;

      console.log("🔍 Fetching notifications with query:", {
        currentUserRole,
        currentUserId,
        currentUserEmail,
        userId,
        userEmail,
        feature,
        type,
        notificationType,
      });

      // Build query conditions
      const conditions: Record<string, unknown> = {};

      // CRITICAL FIX: Role-based filtering using notificationType field
      if (currentUserRole === "admin") {
        // Admin sees ONLY admin notifications
        conditions.notificationType = "admin";
        console.log("👑 Admin fetching ONLY admin notifications");
      } else if (currentUserRole === "user") {
        // User sees ONLY their user notifications
        conditions.notificationType = "user";

        // CRITICAL: Also filter by user-specific criteria (userId or userEmail)
        const userConditions = [];

        if (currentUserId) {
          userConditions.push({ userId: currentUserId });
          userConditions.push({ targetUserIds: { $in: [currentUserId] } });
        }

        if (currentUserEmail) {
          userConditions.push({ userEmail: currentUserEmail });
        }

        if (userConditions.length > 0) {
          conditions.$or = userConditions;
        }

        console.log("👤 User fetching ONLY their user notifications:", {
          userId: currentUserId,
          userEmail: currentUserEmail,
        });
      } else {
        // Guests see nothing
        console.log("👤 Guest user, returning empty notifications");
        return {
          success: true,
          notifications: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 },
        };
      }

      // If explicit notificationType is provided, use it (overrides role-based)
      if (notificationType) {
        conditions.notificationType = notificationType;
        console.log(
          "🎯 Overriding with explicit notificationType:",
          notificationType
        );
      }

      // Apply additional filters
      if (feature) conditions.feature = feature;
      if (type) conditions.type = type;
      if (isRead !== undefined) conditions.isRead = isRead;
      if (relatedId) conditions.relatedId = relatedId;

      // Pagination
      const skip = (page - 1) * limit;

      console.log(
        "📋 Final MongoDB query:",
        JSON.stringify(conditions, null, 2)
      );

      const notifications = await NotificationModel.find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await NotificationModel.countDocuments(conditions);

      console.log(
        `✅ Found ${notifications.length} notifications out of ${total} total`
      );

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
          notificationType: notification.notificationType || "user",
          channels: notification.channels || ["in_app"], // Include channels
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
    currentUserId?: string,
    currentUserEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    await dbConnect();

    try {
      console.log("🔍 Marking notification as read:", {
        notificationId,
        currentUserRole,
        currentUserId,
        currentUserEmail,
      });

      let notification;

      if (currentUserRole === "admin") {
        notification = await NotificationModel.findOne({
          _id: notificationId,
          notificationType: "admin",
        });
      } else if (currentUserRole === "user") {
        const userConditions = [
          { userId: currentUserId },
          { userEmail: currentUserEmail },
          { targetUserIds: { $in: [currentUserId] } },
        ].filter((condition) => {
          if (condition.userId) return !!currentUserId;
          if (condition.userEmail) return !!currentUserEmail;
          return !!currentUserId;
        });

        notification = await NotificationModel.findOne({
          _id: notificationId,
          notificationType: "user",
          $or:
            userConditions.length > 0 ? userConditions : [{ userId: "none" }],
        });
      } else {
        return { success: false, error: "Invalid user role" };
      }

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
      console.log("🔍 Marking all notifications as read:", {
        userId,
        userRole,
        userEmail,
      });

      const conditions: Record<string, unknown> = { isRead: false };

      if (userRole === "admin") {
        conditions.notificationType = "admin";
      } else if (userRole === "user") {
        conditions.notificationType = "user";
        const userConditions = [];

        if (userId) {
          userConditions.push({ userId });
          userConditions.push({ targetUserIds: { $in: [userId] } });
        }

        if (userEmail) {
          userConditions.push({ userEmail });
        }

        if (userConditions.length > 0) {
          conditions.$or = userConditions;
        }
      } else {
        return { success: false, error: "Invalid user role" };
      }

      await NotificationModel.updateMany(conditions, { isRead: true });
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
    userId?: string,
    userEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    await dbConnect();

    try {
      console.log("🔍 Deleting notification:", {
        notificationId,
        userRole,
        userId,
        userEmail,
      });

      let notification;

      if (userRole === "admin") {
        notification = await NotificationModel.findOne({
          _id: notificationId,
          notificationType: "admin",
        });
      } else if (userRole === "user") {
        const userConditions = [
          { userId },
          { userEmail },
          { targetUserIds: { $in: [userId] } },
        ].filter((condition) => {
          if (condition.userId) return !!userId;
          if (condition.userEmail) return !!userEmail;
          return !!userId;
        });

        notification = await NotificationModel.findOne({
          _id: notificationId,
          notificationType: "user",
          $or:
            userConditions.length > 0 ? userConditions : [{ userId: "none" }],
        });
      } else {
        return { success: false, error: "Invalid user role" };
      }

      if (!notification) {
        return {
          success: false,
          error: "Notification not found or access denied",
        };
      }

      await NotificationModel.findByIdAndDelete(notificationId);
      return { success: true };
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
      console.log("🔍 Clearing all notifications for user:", {
        userId,
        userRole,
        userEmail,
      });

      let conditions = {};

      if (userRole === "admin") {
        conditions = { notificationType: "admin" };
      } else if (userRole === "user") {
        const userConditions = [];

        if (userId) {
          userConditions.push({ userId });
          userConditions.push({ targetUserIds: { $in: [userId] } });
        }

        if (userEmail) {
          userConditions.push({ userEmail });
        }

        conditions = {
          notificationType: "user",
          $or:
            userConditions.length > 0 ? userConditions : [{ userId: "none" }],
        };
      } else {
        return { success: false, error: "Invalid user role" };
      }

      await NotificationModel.deleteMany(conditions);
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
      console.log("🔍 Getting notification stats:", {
        userId,
        userRole,
        userEmail,
      });

      let conditions: Record<string, unknown> = {};

      if (userRole === "admin") {
        conditions.notificationType = "admin";
        console.log("👑 Admin getting stats for ADMIN notifications only");
      } else if (userRole === "user") {
        conditions.notificationType = "user";

        const userConditions = [];

        if (userId) {
          userConditions.push({ userId });
          userConditions.push({ targetUserIds: { $in: [userId] } });
        }

        if (userEmail) {
          userConditions.push({ userEmail });
        }

        if (userConditions.length > 0) {
          conditions.$or = userConditions;
        }

        console.log("👤 User getting stats for USER notifications only:", {
          userId,
          userEmail,
        });
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

      console.log("📊 Notification stats:", {
        total,
        unread,
        read: total - unread,
        byFeature,
        notificationType: userRole === "admin" ? "admin" : "user",
      });

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

      if (feature === "all" || feature === "pdc") {
        paths.push("/admin/pdc");
      }

      paths.forEach((path) => {
        revalidatePath(path);
      });

      console.log("🔄 Revalidated paths:", paths);
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
