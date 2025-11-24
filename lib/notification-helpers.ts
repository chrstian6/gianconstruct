// lib/notification-helpers.ts - UPDATED TO CREATE NOTIFICATIONS FOR TIMELINE UPDATES
import { notificationService } from "./notification-services";
import { EmailTemplates, generateEmailTemplate } from "./email-templates";
import { sendEmail } from "@/lib/nodemailer";

// Helper function to send email notifications
async function sendProjectEmail(
  userEmail: string,
  templateData: any,
  emailData: any
) {
  try {
    if (!userEmail) {
      console.log("📧 No email address provided, skipping email notification");
      return;
    }

    const emailTemplate = generateEmailTemplate(emailData.data);

    await sendEmail({
      to: userEmail,
      subject: emailData.subject,
      html: emailTemplate,
    });

    console.log(`✅ Project email sent successfully to ${userEmail}`);
  } catch (emailError) {
    console.error("❌ Error sending project email:", emailError);
    // Don't throw error - email failure shouldn't break the main functionality
  }
}

// Appointment notifications (inquiry related only)
export const appointmentNotifications = {
  async confirmed(inquiry: any, design: any, userRole: string = "admin") {
    console.log("📝 Creating confirmed notification for user:", {
      inquiryId: inquiry._id,
      userId: inquiry.user_id,
      userEmail: inquiry.email,
      userRole: userRole,
    });

    // For confirmed appointments (admin action), notify the specific user
    const notificationData = {
      userId: inquiry.user_id, // Target the specific user
      userEmail: inquiry.email,
      feature: "appointments",
      type: "appointment_confirmed",
      title: "Appointment Confirmed",
      message: `Your appointment for ${design.name} has been confirmed for ${inquiry.preferredDate} at ${inquiry.preferredTime}`,
      createdByRole: userRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: inquiry._id?.toString(),
      appointmentMetadata: {
        inquiryId: inquiry._id?.toString(),
        appointmentId: inquiry._id?.toString(),
        originalDate: inquiry.preferredDate,
        originalTime: inquiry.preferredTime,
        meetingType: inquiry.meetingType,
      },
      actionUrl: `/user/appointments`,
      actionLabel: "View My Appointments",
      pushData: {
        title: "Appointment Confirmed",
        body: `Your appointment for ${design.name} has been confirmed`,
        icon: "/icons/calendar-check.png",
      },
    };

    return await notificationService.createNotification(notificationData);
  },

  async cancelled(
    inquiry: any,
    design: any,
    reason?: string,
    userRole: string = "admin"
  ) {
    console.log("📝 Creating cancelled notification for user:", {
      inquiryId: inquiry._id,
      userId: inquiry.user_id,
      userEmail: inquiry.email,
    });

    // For cancelled appointments (admin action), notify the specific user
    const notificationData = {
      userId: inquiry.user_id, // Target the specific user
      userEmail: inquiry.email,
      feature: "appointments",
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Your appointment for ${design.name} has been cancelled${reason ? `: ${reason}` : ""}`,
      createdByRole: userRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: inquiry._id?.toString(),
      appointmentMetadata: {
        inquiryId: inquiry._id?.toString(),
        appointmentId: inquiry._id?.toString(),
        originalDate: inquiry.preferredDate,
        originalTime: inquiry.preferredTime,
        reason,
        meetingType: inquiry.meetingType,
      },
      pushData: {
        title: "Appointment Cancelled",
        body: `Your appointment for ${design.name} has been cancelled`,
        icon: "/icons/calendar-cancel.png",
      },
    };

    return await notificationService.createNotification(notificationData);
  },

  async rescheduled(
    inquiry: any,
    design: any,
    newDate: string,
    newTime: string,
    notes?: string,
    userRole: string = "admin"
  ) {
    console.log("📝 Creating rescheduled notification for user:", {
      inquiryId: inquiry._id,
      userId: inquiry.user_id,
      userEmail: inquiry.email,
    });

    // For rescheduled appointments (admin action), notify the specific user
    const notificationData = {
      userId: inquiry.user_id, // Target the specific user
      userEmail: inquiry.email,
      feature: "appointments",
      type: "appointment_rescheduled",
      title: "Appointment Rescheduled",
      message: `Your appointment for ${design.name} has been rescheduled to ${newDate} at ${newTime}`,
      createdByRole: userRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: inquiry._id?.toString(),
      appointmentMetadata: {
        inquiryId: inquiry._id?.toString(),
        appointmentId: inquiry._id?.toString(),
        originalDate: inquiry.preferredDate,
        originalTime: inquiry.preferredTime,
        newDate,
        newTime,
        notes,
        meetingType: inquiry.meetingType,
      },
      actionUrl: `/user/appointments`,
      actionLabel: "View Updated Appointment",
      pushData: {
        title: "Appointment Rescheduled",
        body: `Your appointment for ${design.name} has been rescheduled`,
        icon: "/icons/calendar-reschedule.png",
      },
    };

    return await notificationService.createNotification(notificationData);
  },

  async completed(inquiry: any, design: any, userRole: string = "admin") {
    console.log("📝 Creating completed notification for user:", {
      inquiryId: inquiry._id,
      userId: inquiry.user_id,
      userEmail: inquiry.email,
    });

    // For completed appointments (admin action), notify the specific user
    const notificationData = {
      userId: inquiry.user_id, // Target the specific user
      userEmail: inquiry.email,
      feature: "appointments",
      type: "appointment_completed",
      title: "Consultation Completed",
      message: `Your consultation for ${design.name} has been completed. Thank you for choosing GianConstruct!`,
      createdByRole: userRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: inquiry._id?.toString(),
      appointmentMetadata: {
        inquiryId: inquiry._id?.toString(),
        appointmentId: inquiry._id?.toString(),
        originalDate: inquiry.preferredDate,
        originalTime: inquiry.preferredTime,
        meetingType: inquiry.meetingType,
      },
      pushData: {
        title: "Consultation Completed",
        body: `Your consultation for ${design.name} has been completed`,
        icon: "/icons/calendar-completed.png",
      },
    };

    return await notificationService.createNotification(notificationData);
  },

  async newInquiry(inquiry: any, design: any, userRole: string = "user") {
    console.log("📝 Creating new inquiry notification for admin:", {
      inquiryId: inquiry._id,
      userId: inquiry.user_id,
      userEmail: inquiry.email,
      userRole: userRole,
    });

    const notificationData = {
      userEmail: inquiry.email,
      targetUserRoles: ["admin"], // Target all admins
      feature: "appointments",
      type: "inquiry_submitted",
      title: "New Consultation Inquiry",
      message: `${inquiry.name} submitted a consultation request for ${design.name}`,
      createdByRole: userRole, // User created this notification
      channels: ["in_app", "email"],
      relatedId: inquiry._id?.toString(),
      appointmentMetadata: {
        inquiryId: inquiry._id?.toString(),
        meetingType: inquiry.meetingType,
      },
      actionUrl: `/admin/appointments/${inquiry._id}`,
      actionLabel: "Review Inquiry",
      pushData: {
        title: "New Inquiry",
        body: `${inquiry.name} submitted a consultation request`,
        icon: "/icons/inquiry.png",
      },
    };

    // Only add userId for registered users (for tracking)
    if (inquiry.user_id && userRole === "user") {
      (notificationData as any).userId = inquiry.user_id;
    }

    return await notificationService.createNotification(notificationData);
  },
};

// Project notifications - UPDATED TO CREATE NOTIFICATIONS FOR ALL TIMELINE UPDATES
export const projectNotifications = {
  async created(project: any, user: any, createdByRole: string = "admin") {
    console.log("📝 Creating project created notification for admin:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: user?.user_id,
      userRole: user?.role,
    });

    const notificationData = {
      userEmail: user?.email,
      targetUserRoles: ["admin"], // Target all admins
      feature: "projects",
      type: "project_created",
      title: "New Project Created",
      message: `A new project "${project.name}" has been created and is awaiting confirmation.`,
      createdByRole: createdByRole,
      channels: ["in_app", "email"],
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        status: project.status,
        timelineId: project._id?.toString(),
      },
      actionUrl: `/admin/admin-project/${project.project_id}`,
      actionLabel: "Review Project",
      pushData: {
        title: "New Project Created",
        body: `A new project "${project.name}" has been created`,
        icon: "/icons/project-created.png",
      },
    };

    // Only add userId for registered users (for tracking)
    if (user?.user_id) {
      (notificationData as any).userId = user.user_id;
    }

    // Send email notification to user
    if (user?.email) {
      try {
        const emailTemplate = EmailTemplates.projectCreated(project, user);
        await sendProjectEmail(user.email, project, emailTemplate);
      } catch (emailError) {
        console.error("❌ Error sending project creation email:", emailError);
      }
    }

    return await notificationService.createNotification(notificationData);
  },

  async confirmed(project: any, user: any, createdByRole: string = "admin") {
    console.log("📝 Creating project confirmed notification for user:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: project.userId,
    });

    const notificationData = {
      userId: project.userId, // Target the specific user
      userEmail: user?.email,
      feature: "projects",
      type: "project_confirmed",
      title: "Project Confirmed",
      message: `Your project "${project.name}" has been confirmed and is now active.`,
      createdByRole: createdByRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        status: project.status,
        timelineId: project._id?.toString(),
      },
      actionUrl: `/user/projects/${project.project_id}`,
      actionLabel: "View Project",
      pushData: {
        title: "Project Confirmed",
        body: `Your project "${project.name}" has been confirmed`,
        icon: "/icons/project-confirmed.png",
      },
    };

    // Send email notification to user
    if (user?.email) {
      try {
        const emailTemplate = EmailTemplates.projectStatusUpdate(
          project,
          user,
          "pending",
          "active"
        );
        await sendProjectEmail(user.email, project, emailTemplate);
      } catch (emailError) {
        console.error(
          "❌ Error sending project confirmation email:",
          emailError
        );
      }
    }

    return await notificationService.createNotification(notificationData);
  },

  async updated(project: any, user: any, createdByRole: string = "admin") {
    console.log("📝 Creating project updated notification for user:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: project.userId,
    });

    const notificationData = {
      userId: project.userId, // Target the specific user
      userEmail: user?.email,
      feature: "projects",
      type: "project_updated",
      title: "Project Updated",
      message: `Project "${project.name}" has been updated.`,
      createdByRole: createdByRole, // Admin created this notification
      channels: ["in_app"],
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        status: project.status,
        timelineId: project._id?.toString(),
      },
      actionUrl: `/user/projects/${project.project_id}`,
      actionLabel: "View Project",
    };

    return await notificationService.createNotification(notificationData);
  },

  async completed(project: any, user: any, createdByRole: string = "admin") {
    console.log("📝 Creating project completed notification for user:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: project.userId,
    });

    const notificationData = {
      userId: project.userId, // Target the specific user
      userEmail: user?.email,
      feature: "projects",
      type: "project_completed",
      title: "Project Completed",
      message: `Congratulations! Your project "${project.name}" has been completed.`,
      createdByRole: createdByRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        status: project.status,
        timelineId: project._id?.toString(),
      },
      actionUrl: `/user/projects/${project.project_id}`,
      actionLabel: "View Completed Project",
      pushData: {
        title: "Project Completed",
        body: `Your project "${project.name}" has been completed`,
        icon: "/icons/project-completed.png",
      },
    };

    // Send email notification to user
    if (user?.email) {
      try {
        const emailTemplate = EmailTemplates.projectStatusUpdate(
          project,
          user,
          "active",
          "completed"
        );
        await sendProjectEmail(user.email, project, emailTemplate);
      } catch (emailError) {
        console.error("❌ Error sending project completion email:", emailError);
      }
    }

    return await notificationService.createNotification(notificationData);
  },

  async cancelled(project: any, user: any, createdByRole: string = "admin") {
    console.log("📝 Creating project cancelled notification for user:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: project.userId,
    });

    const notificationData = {
      userId: project.userId, // Target the specific user
      userEmail: user?.email,
      feature: "projects",
      type: "project_cancelled",
      title: "Project Cancelled",
      message: `Project "${project.name}" has been cancelled.`,
      createdByRole: createdByRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        status: project.status,
        timelineId: project._id?.toString(),
      },
      actionUrl: `/user/projects`,
      actionLabel: "View Projects",
      pushData: {
        title: "Project Cancelled",
        body: `Project "${project.name}" has been cancelled`,
        icon: "/icons/project-cancelled.png",
      },
    };

    // Send email notification to user
    if (user?.email) {
      try {
        const emailTemplate = EmailTemplates.projectStatusUpdate(
          project,
          user,
          project.status,
          "cancelled"
        );
        await sendProjectEmail(user.email, project, emailTemplate);
      } catch (emailError) {
        console.error(
          "❌ Error sending project cancellation email:",
          emailError
        );
      }
    }

    return await notificationService.createNotification(notificationData);
  },

  async milestoneReached(
    project: any,
    user: any,
    milestone: string,
    progress?: number,
    createdByRole: string = "admin"
  ) {
    console.log("📝 Creating milestone reached notification for user:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: project.userId,
      milestone,
      progress,
    });

    const message = progress
      ? `Project "${project.name}" has reached ${progress}% completion: ${milestone}`
      : `Project "${project.name}" has reached a milestone: ${milestone}`;

    const notificationData = {
      userId: project.userId, // Target the specific user
      userEmail: user?.email,
      feature: "projects",
      type: "milestone_reached",
      title: "Project Milestone Reached",
      message: message,
      createdByRole: createdByRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        milestone: milestone,
        progress: progress,
        timelineId: project._id?.toString(),
      },
      actionUrl: `/user/projects/${project.project_id}`,
      actionLabel: "View Progress",
      pushData: {
        title: "Milestone Reached",
        body: message,
        icon: "/icons/milestone.png",
      },
    };

    // Send email notification to user
    if (user?.email && progress !== undefined) {
      try {
        const emailTemplate = EmailTemplates.projectMilestoneReached(
          project,
          user,
          milestone,
          progress
        );
        await sendProjectEmail(user.email, project, emailTemplate);
      } catch (emailError) {
        console.error("❌ Error sending milestone email:", emailError);
      }
    }

    return await notificationService.createNotification(notificationData);
  },

  async timelineUpdate(
    project: any,
    user: any,
    updateTitle: string,
    updateDescription?: string,
    progress?: number,
    createdByRole: string = "admin"
  ) {
    console.log("📝 Creating timeline update notification for user:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: project.userId,
      updateTitle,
      updateDescription,
      progress,
    });

    const message = updateDescription
      ? `New update for "${project.name}": ${updateTitle} - ${updateDescription}`
      : `New update for "${project.name}": ${updateTitle}`;

    const notificationData = {
      userId: project.userId, // Target the specific user
      userEmail: user?.email,
      feature: "projects",
      type: "project_timeline_update",
      title: "Project Timeline Updated",
      message: message,
      createdByRole: createdByRole, // Admin created this notification
      channels: ["in_app", "email"],
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        timelineId: project._id?.toString(),
        updateTitle: updateTitle,
        updateDescription: updateDescription,
        progress: progress,
      },
      actionUrl: `/user/projects/${project.project_id}`,
      actionLabel: "View Update",
      pushData: {
        title: "Project Update",
        body: message,
        icon: "/icons/timeline-update.png",
      },
    };

    // Send email notification to user
    if (user?.email) {
      try {
        const emailTemplate = EmailTemplates.projectTimelineUpdate(
          project,
          user,
          updateTitle,
          updateDescription,
          progress
        );
        await sendProjectEmail(user.email, project, emailTemplate);
      } catch (emailError) {
        console.error("❌ Error sending timeline update email:", emailError);
      }
    }

    return await notificationService.createNotification(notificationData);
  },

  // NEW: Specific function for photo uploads to timeline
  // In lib/notification-helpers.ts, update the timelinePhotoUpload function:
  async timelinePhotoUpload(
    project: any,
    user: any,
    caption: string,
    progress?: number,
    createdByRole: string = "admin"
  ) {
    console.log("🔍 NOTIFICATION HELPER: Starting timelinePhotoUpload...");
    console.log("🔍 NOTIFICATION HELPER: Project data:", {
      projectId: project.project_id,
      projectName: project.name,
      userId: project.userId,
    });
    console.log("🔍 NOTIFICATION HELPER: User data:", {
      user_id: user?.user_id,
      email: user?.email,
    });

    const message = progress
      ? `New photos added to "${project.name}": ${caption} (Progress: ${progress}%)`
      : `New photos added to "${project.name}": ${caption}`;

    const notificationData = {
      userId: project.userId, // Target the specific user
      userEmail: user?.email,
      feature: "projects",
      type: "timeline_photo_upload",
      title: "New Project Photos",
      message: message,
      createdByRole: createdByRole,
      channels: ["in_app", "email"], // Make sure in_app is included
      relatedId: project.project_id,
      projectMetadata: {
        projectId: project.project_id,
        projectName: project.name,
        caption: caption,
        progress: progress,
        hasPhotos: true,
      },
      actionUrl: `/user/projects/${project.project_id}`,
      actionLabel: "View Photos",
      pushData: {
        title: "New Project Photos",
        body: message,
        icon: "/icons/photo-upload.png",
      },
    };

    console.log(
      "🔍 NOTIFICATION HELPER: Calling notificationService.createNotification..."
    );

    try {
      const result =
        await notificationService.createNotification(notificationData);
      console.log("✅ NOTIFICATION HELPER: Notification service returned:", {
        success: !!result,
        _id: result?._id,
        type: result?.type,
      });
      return result;
    } catch (error) {
      console.error(
        "❌ NOTIFICATION HELPER: Error in createNotification:",
        error
      );
      // Don't throw the error - we don't want to break the main functionality
      console.log("⚠️ NOTIFICATION HELPER: Continuing without notification...");
      return null;
    }
  },
};
