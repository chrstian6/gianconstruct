// actions/inquiries.ts - UPDATED TO ALIGN WITH NOTIFICATION-SERVICES
"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { sendEmail } from "@/lib/nodemailer";
import { Inquiry, InquiryDocument } from "@/models/Inquiry";
import User from "@/models/User";
import DesignModel from "@/models/Design";
import { generateEmailTemplate, EmailTemplates } from "@/lib/email-templates";
import { notificationService } from "@/lib/notification-services";

interface InquirySubmitResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// Helper functions for date and time formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export async function submitInquiry(
  formData: FormData
): Promise<InquirySubmitResponse> {
  await dbConnect();

  try {
    // Extract form data
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const name = `${firstName} ${lastName}`.trim();
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;
    const preferredDate = formData.get("preferredDate") as string;
    const preferredTime = formData.get("preferredTime") as string;
    const meetingType = formData.get("meetingType") as string;
    const designId = formData.get("designId") as string;
    const user_id = formData.get("user_id") as string;

    console.log("🔍 SUBMIT INQUIRY - Form Data Received:", {
      firstName,
      lastName,
      email,
      phone: phone ? "***" : "missing",
      message: message ? "***" : "missing",
      preferredDate,
      preferredTime,
      meetingType,
      designId,
      user_id: user_id || "NOT PROVIDED",
    });

    // Basic validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !message ||
      !designId ||
      !preferredDate ||
      !preferredTime ||
      !meetingType
    ) {
      console.error("❌ VALIDATION FAILED - Missing required fields");
      return { success: false, error: "All fields are required" };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      console.error("❌ VALIDATION FAILED - Invalid email format:", email);
      return { success: false, error: "Invalid email format" };
    }

    // Fetch design details using design_id
    const design = await DesignModel.findOne({ design_id: designId });
    if (!design) {
      console.error("❌ DESIGN NOT FOUND - design_id:", designId);
      return { success: false, error: "Design not found" };
    }

    console.log("✅ Design found:", design.name);

    // USER IDENTIFICATION LOGIC
    let user = null;
    let isGuest = true;
    let userId: string | undefined = undefined;

    console.log("👤 USER IDENTIFICATION - Starting user lookup...");

    // Priority 1: Lookup by user_id if provided
    if (user_id) {
      console.log("🔍 Looking up user by user_id:", user_id);
      user = await User.findOne({ user_id: user_id });
      if (user) {
        console.log("✅ User found by user_id:", {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        });
        // Check if user exists and has a valid role (not just "user" role)
        if (user.role && user.role !== "guest") {
          isGuest = false;
          userId = user_id;
          console.log(
            "✅ Registered user identified by user_id - userId:",
            userId,
            "role:",
            user.role
          );
        } else {
          console.log("⚠️ User found but has guest role:", user.role);
        }
      } else {
        console.log("❌ No user found with user_id:", user_id);
      }
    }

    // Priority 2: If no user found by user_id, lookup by email
    if (!user) {
      console.log("🔍 No user found by user_id, looking up by email:", email);
      user = await User.findOne({ email: email });
      if (user) {
        console.log("✅ User found by email:", {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        });
        // Check if user exists and has a valid role (not just "user" role)
        if (user.role && user.role !== "guest") {
          isGuest = false;
          userId = user.user_id;
          console.log(
            "✅ Registered user identified by email - userId:",
            userId,
            "role:",
            user.role
          );
        } else {
          console.log("⚠️ User found but has guest role:", user.role);
        }
      } else {
        console.log("❌ No user found with email:", email);
      }
    }

    // If we still don't have a user, check if user_id was provided but no user found
    if (!user && user_id) {
      console.log(
        "⚠️ user_id was provided but no user found in database. Treating as guest."
      );
      isGuest = true;
      userId = undefined;
    }

    console.log("👤 FINAL USER STATUS:", {
      isGuest,
      userId,
      userEmail: email,
      userRole: user?.role || "guest",
    });

    // Prepare inquiry data with design details and user info
    const inquiryData: any = {
      name,
      email,
      phone,
      message,
      design: {
        id: design.design_id,
        name: design.name,
        price: design.price,
        square_meters: design.square_meters,
      },
      submittedAt: new Date().toISOString(),
      status: "pending",
      preferredDate,
      preferredTime,
      meetingType,
      userType: isGuest ? "guest" : "registered",
      userRole: user?.role || "guest",
    };

    // Only add user_id to inquiry if user is registered (not guest)
    if (userId && !isGuest) {
      inquiryData.user_id = userId;
      console.log("✅ Added user_id to inquiry:", userId);
    } else {
      console.log("ℹ️ No user_id added to inquiry (guest user)");
    }

    console.log("💾 Saving inquiry to database...");
    // Save to MongoDB
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();
    console.log("✅ Inquiry saved with ID:", inquiry._id.toString());

    // Create transformed inquiry object for notifications and emails
    const transformedInquiry = {
      _id: inquiry._id.toString(),
      name,
      email,
      phone,
      message,
      preferredDate,
      preferredTime,
      meetingType: meetingType as "phone" | "onsite" | "video",
      design: {
        id: design.design_id,
        name: design.name,
        price: design.price,
        square_meters: design.square_meters,
      },
      userType: isGuest ? "guest" : "registered",
      user_id: userId,
      userRole: user?.role || "guest",
    };

    // CREATE NOTIFICATION USING CENTRALIZED NOTIFICATION SERVICE
    try {
      console.log("📝 Creating notification using centralized service...");

      // Create notification for admin about new inquiry
      const notificationParams = {
        targetUserRoles: ["admin"],
        feature: "appointments",
        type: "inquiry_submitted",
        title: "New Appointment Request Received",
        message: `${name} has submitted a new appointment request for ${design.name}`,
        channels: ["in_app", "email"],
        appointmentMetadata: {
          inquiryId: inquiry._id.toString(),
          clientName: name,
          clientEmail: email,
          designName: design.name,
          preferredDate: preferredDate,
          preferredTime: preferredTime,
          meetingType: meetingType,
          originalDate: preferredDate,
          originalTime: preferredTime,
        },
        relatedId: inquiry._id.toString(),
        actionUrl: `/admin/appointments?inquiry=${inquiry._id.toString()}`,
        actionLabel: "Review Appointment",
        metadata: {
          inquiryId: inquiry._id.toString(),
          clientName: name,
          clientEmail: email,
          designName: design.name,
          userType: isGuest ? "guest" : "registered",
          userRole: user?.role || "guest",
        },
      };

      const notificationResult =
        await notificationService.createNotification(notificationParams);

      if (notificationResult && notificationResult._id) {
        console.log("✅ Notification created successfully:", {
          notificationId: notificationResult._id,
          type: "inquiry_submitted",
          target: "admin",
        });
      } else {
        console.error("❌ Notification creation failed");
        // Don't fail the entire inquiry submission if notification fails
      }
    } catch (notificationError) {
      console.error("❌ Error creating notification:", notificationError);
      // Don't fail the entire inquiry submission if notification fails
    }

    // Send internal notification to admin using new template
    try {
      const internalTemplate = EmailTemplates.internalNewInquiry(
        transformedInquiry,
        formatDate,
        formatTime
      );

      const adminEmail = process.env.COMPANY_EMAIL || "admin@gianconstruct.com";
      await sendEmail({
        to: adminEmail,
        subject: internalTemplate.subject,
        html: generateEmailTemplate(internalTemplate.data),
      });
      console.log("✅ Admin notification email sent");
    } catch (emailError) {
      console.error("❌ Error sending admin email:", emailError);
    }

    // Send auto-reply to user using new template
    try {
      const userTemplate = {
        subject: "Appointment Request Confirmation - GianConstruct",
        data: {
          title: "Appointment Request Received 📋",
          message: `Dear <strong>${name}</strong>,<br><br>
          Thank you for choosing <strong>GianConstruct</strong> for your dream home project. We're excited to inform you that we have successfully received your consultation request for <strong>${design.name}</strong> and are looking forward to helping you bring your vision to life.`,
          details: `
            <div class="detail-row">
              <span class="detail-label">Appointment Date</span>
              <span class="detail-value">${formatDate(preferredDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Scheduled Time</span>
              <span class="detail-value">${formatTime(preferredTime)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Meeting Format</span>
              <span class="detail-value">${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)} Consultation</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Selected Design</span>
              <span class="detail-value">${design.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reference ID</span>
              <span class="detail-value">GC-${inquiry._id.toString().slice(-6).toUpperCase()}</span>
            </div>
          `,
          nextSteps:
            "Our team will contact you within 24 hours to confirm your appointment details. Please prepare any relevant documents, questions, or materials you would like to discuss during our consultation.",
          showButton: false,
        },
      };

      await sendEmail({
        to: email,
        subject: userTemplate.subject,
        html: generateEmailTemplate(userTemplate.data),
      });
      console.log("✅ User confirmation email sent");
    } catch (emailError) {
      console.error("❌ Error sending user email:", emailError);
    }

    // Revalidate paths to update UI
    revalidatePath("/admin/notifications");
    revalidatePath("/user/userdashboard");
    revalidatePath("/admin/appointments");

    console.log("🎉 Inquiry submission completed successfully!");

    return {
      success: true,
      data: {
        id: inquiry._id.toString(),
        user_id: userId || null,
        userType: isGuest ? "guest" : "registered",
      },
    };
  } catch (error) {
    console.error("❌ Error submitting inquiry:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// Get user-specific notifications using centralized notification service
export async function getUserNotifications(user_id: string): Promise<{
  success: boolean;
  notifications?: any[];
  error?: string;
}> {
  try {
    const result = await notificationService.getNotifications({
      currentUserRole: "user",
      currentUserId: user_id,
      page: 1,
      limit: 50,
    });

    if (result.success) {
      return {
        success: true,
        notifications: result.notifications || [],
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to fetch notifications",
        notifications: [],
      };
    }
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
      notifications: [],
    };
  }
}

// Update markNotificationAsRead to use centralized notification service
export async function markNotificationAsRead(
  notificationId: string,
  currentUserId?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    return await notificationService.markAsRead(
      notificationId,
      "user",
      currentUserId
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: "Failed to mark notification as read",
    };
  }
}

// Update markAllNotificationsAsRead to use centralized notification service
export async function markAllNotificationsAsRead(user_id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    return await notificationService.markAllAsRead(user_id, "user");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
    };
  }
}

// Get notifications using centralized notification service
export async function getNotifications(): Promise<{
  success: boolean;
  notifications?: any[];
  error?: string;
}> {
  try {
    const result = await notificationService.getNotifications({
      currentUserRole: "admin",
      page: 1,
      limit: 50,
    });

    if (result.success) {
      return {
        success: true,
        notifications: result.notifications || [],
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to fetch notifications",
        notifications: [],
      };
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
      notifications: [],
    };
  }
}

// Delete notification using centralized notification service
export async function deleteNotification(notificationId: string) {
  try {
    return await notificationService.deleteNotification(
      notificationId,
      "admin"
    );
  } catch (error) {
    console.error("Delete notification error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete notification",
    };
  }
}

// Clear all notifications using centralized notification service
export async function clearAllNotifications() {
  try {
    return await notificationService.clearAllUserNotifications(
      "admin",
      "admin"
    );
  } catch (error) {
    console.error("Clear all notifications error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to clear notifications",
    };
  }
}

// Alias for markNotificationAsRead for backward compatibility
export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  return await markNotificationAsRead(notificationId);
}

// Get notification statistics using centralized notification service
export async function getNotificationStats(user_id: string) {
  try {
    return await notificationService.getNotificationStats(user_id, "user");
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return {
      success: false,
      error: "Failed to fetch notification statistics",
      stats: { total: 0, unread: 0, read: 0, byFeature: {} },
    };
  }
}

// Get admin notification statistics
export async function getAdminNotificationStats() {
  try {
    return await notificationService.getNotificationStats("admin", "admin");
  } catch (error) {
    console.error("Error fetching admin notification stats:", error);
    return {
      success: false,
      error: "Failed to fetch notification statistics",
      stats: { total: 0, unread: 0, read: 0, byFeature: {} },
    };
  }
}

// Get inquiries (existing functionality)
export async function getInquiries(): Promise<{
  success: boolean;
  inquiries?: any[];
  error?: string;
}> {
  await dbConnect();

  try {
    const inquiries = await Inquiry.find()
      .sort({ preferredDate: 1, preferredTime: 1 })
      .lean();

    const transformedInquiries = inquiries.map((inquiry) => ({
      _id: inquiry._id.toString(),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      preferredDate: inquiry.preferredDate,
      preferredTime: inquiry.preferredTime,
      meetingType: inquiry.meetingType,
      status: inquiry.status,
      design: {
        id: inquiry.design.id,
        name: inquiry.design.name,
        price: (inquiry.design as any).price,
        square_meters: (inquiry.design as any).square_meters,
      },
      submittedAt: inquiry.submittedAt,
      notes: inquiry.notes,
      cancellationReason: inquiry.cancellationReason,
      rescheduleNotes: inquiry.rescheduleNotes,
      userType: inquiry.userType,
      userRole: inquiry.userRole,
    }));

    return {
      success: true,
      inquiries: transformedInquiries,
    };
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return {
      success: false,
      error: "Failed to fetch inquiries",
    };
  }
}

export async function getUserInquiries(
  userEmail: string,
  user_id?: string
): Promise<{
  success: boolean;
  inquiries?: any[];
  error?: string;
}> {
  await dbConnect();

  try {
    let query: any = {};

    if (user_id) {
      query = { $or: [{ user_id: user_id }, { email: userEmail }] };
    } else {
      query = { email: userEmail };
    }

    const inquiries = await Inquiry.find(query)
      .sort({ preferredDate: 1, preferredTime: 1 })
      .lean();

    const transformedInquiries = inquiries.map((inquiry) => ({
      _id: inquiry._id.toString(),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      preferredDate: inquiry.preferredDate,
      preferredTime: inquiry.preferredTime,
      meetingType: inquiry.meetingType,
      status: inquiry.status,
      design: {
        id: inquiry.design.id,
        name: inquiry.design.name,
        price: inquiry.design.price,
        square_meters: inquiry.design.square_meters,
      },
      submittedAt: inquiry.submittedAt,
      notes: inquiry.notes,
      cancellationReason: inquiry.cancellationReason,
      rescheduleNotes: inquiry.rescheduleNotes,
      user_id: inquiry.user_id,
      userType: inquiry.userType,
      userRole: inquiry.userRole,
    }));

    return {
      success: true,
      inquiries: transformedInquiries,
    };
  } catch (error) {
    console.error("Error fetching user inquiries:", error);
    return {
      success: false,
      error: "Failed to fetch user inquiries",
    };
  }
}

// Get inquiry statistics
export async function getInquiryStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  error?: string;
}> {
  await dbConnect();

  try {
    const total = await Inquiry.countDocuments();
    const pending = await Inquiry.countDocuments({ status: "pending" });
    const confirmed = await Inquiry.countDocuments({ status: "confirmed" });
    const cancelled = await Inquiry.countDocuments({ status: "cancelled" });
    const completed = await Inquiry.countDocuments({ status: "completed" });

    return {
      success: true,
      stats: {
        total,
        pending,
        confirmed,
        cancelled,
        completed,
      },
    };
  } catch (error) {
    console.error("Error fetching inquiry stats:", error);
    return {
      success: false,
      error: "Failed to fetch inquiry statistics",
    };
  }
}

// Delete an inquiry
export async function deleteInquiry(inquiryId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await dbConnect();

  try {
    const result = await Inquiry.findByIdAndDelete(inquiryId);

    if (!result) {
      return {
        success: false,
        error: "Inquiry not found",
      };
    }

    revalidatePath("/admin/appointments");
    revalidatePath("/user/userdashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    return {
      success: false,
      error: "Failed to delete inquiry",
    };
  }
}

// Update inquiry status
export async function updateInquiryStatus(
  inquiryId: string,
  status: "pending" | "confirmed" | "cancelled" | "completed"
): Promise<{
  success: boolean;
  error?: string;
  inquiry?: any;
}> {
  await dbConnect();

  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return {
        success: false,
        error: "Inquiry not found",
      };
    }

    const transformedInquiry = {
      _id: inquiry._id.toString(),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      preferredDate: inquiry.preferredDate,
      preferredTime: inquiry.preferredTime,
      meetingType: inquiry.meetingType,
      status: inquiry.status,
      design: {
        id: inquiry.design.id,
        name: inquiry.design.name,
        price: (inquiry.design as any).price,
        square_meters: (inquiry.design as any).square_meters,
      },
      submittedAt: inquiry.submittedAt,
      notes: inquiry.notes,
      cancellationReason: inquiry.cancellationReason,
      rescheduleNotes: inquiry.rescheduleNotes,
      userType: inquiry.userType,
      userRole: inquiry.userRole,
    };

    revalidatePath("/admin/appointments");
    revalidatePath("/user/userdashboard");

    return {
      success: true,
      inquiry: transformedInquiry,
    };
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    return {
      success: false,
      error: "Failed to update inquiry status",
    };
  }
}
