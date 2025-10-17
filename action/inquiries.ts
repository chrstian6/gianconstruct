// actions/inquiries.ts
"use server";

// Import necessary modules
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { sendEmail } from "@/lib/nodemailer";
import { Inquiry, InquiryDocument } from "@/models/Inquiry";
import User from "@/models/User";
import Notification from "@/models/Notification";
import DesignModel from "@/models/Design";
import { generateEmailTemplate, EmailTemplates } from "@/lib/email-templates";

const NotificationModel = Notification;

interface InquirySubmitResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface NotificationResponse {
  success: boolean;
  notifications: Array<{
    _id: string;
    userEmail: string;
    userId?: string; // Added userId for user-specific queries
    design: {
      id: string;
      name: string;
      price?: number;
      square_meters?: number;
      images?: string[];
      isLoanOffer?: boolean;
      maxLoanYears?: number;
      interestRate?: number;
    };
    inquiryDetails: {
      name: string;
      email: string;
      phone: string;
      message: string;
      preferredDate?: string;
      preferredTime?: string;
      meetingType?: string;
    };
    isGuest: boolean;
    createdAt: string;
    isRead?: boolean;
  }>;
  error?: string;
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
    const user_id = formData.get("user_id") as string; // Get user_id from form data

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

    // DYNAMIC USER ID HANDLING
    let user = null;
    let isGuest = true;
    let userId: string | undefined = undefined;

    console.log("👤 USER IDENTIFICATION - Starting user lookup...");

    if (user_id) {
      console.log("🔍 Looking up user by user_id:", user_id);
      // If user_id is provided, find the registered user
      user = await User.findOne({ user_id: user_id });
      if (user) {
        console.log("✅ User found by user_id:", {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        });
        if (user.role === "user") {
          isGuest = false;
          userId = user_id; // Use the user_id (GC-0007) directly
          console.log("✅ Registered user identified - userId:", userId);
        } else {
          console.log("⚠️ User found but not regular user role:", user.role);
        }
      } else {
        console.log("❌ No user found with user_id:", user_id);
      }
    } else {
      console.log("🔍 No user_id provided, looking up by email:", email);
      // If no user_id provided, check if user exists by email
      user = await User.findOne({ email: email });
      if (user) {
        console.log("✅ User found by email:", {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        });
        if (user.role === "user") {
          isGuest = false;
          userId = user.user_id; // Use the user_id (GC-0007)
          console.log("✅ Registered user identified - userId:", userId);
        } else {
          console.log("⚠️ User found but not regular user role:", user.role);
        }
      } else {
        console.log("❌ No user found with email:", email);
      }
    }

    console.log("👤 FINAL USER STATUS:", {
      isGuest,
      userId,
      userEmail: email,
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

    // Create notification with dynamic user ID handling
    const notificationData: any = {
      userEmail: email,
      design: {
        id: design.design_id,
        name: design.name,
        price: design.price,
        square_meters: design.square_meters,
        images: design.images,
        isLoanOffer: design.isLoanOffer,
        maxLoanYears: design.maxLoanTerm
          ? Math.floor(design.maxLoanTerm / 12)
          : undefined,
        interestRate: design.interestRate,
      },
      inquiryDetails: {
        name,
        email,
        phone,
        message,
        preferredDate,
        preferredTime,
        meetingType,
      },
      isGuest,
      type: "inquiry_submitted",
      metadata: {
        inquiryId: inquiry._id.toString(),
      },
    };

    // Only add userId to notification if user is registered (not guest)
    if (userId && !isGuest) {
      notificationData.userId = userId; // This will be "GC-0007"
      console.log("✅ Added userId to notification:", userId);
    } else {
      console.log("ℹ️ No userId added to notification (guest user)");
    }

    console.log("🔔 NOTIFICATION DATA TO BE SAVED:", {
      userEmail: notificationData.userEmail,
      userId: notificationData.userId || "NOT SET",
      isGuest: notificationData.isGuest,
      type: notificationData.type,
    });

    const notification = new NotificationModel(notificationData);
    await notification.save();

    console.log("✅ Notification saved with ID:", notification._id.toString());
    console.log("🔔 FINAL NOTIFICATION SAVED:", {
      _id: notification._id.toString(),
      userEmail: notification.userEmail,
      userId: notification.userId || "MISSING",
      isGuest: notification.isGuest,
    });

    revalidatePath("/admin/notifications");
    revalidatePath("/user/userdashboard"); // Revalidate user dashboard

    // Create transformed inquiry object for email templates
    const transformedInquiry = {
      _id: inquiry._id.toString(),
      name,
      email,
      phone,
      message,
      preferredDate,
      preferredTime,
      meetingType,
      design: {
        id: design.design_id,
        name: design.name,
        price: design.price,
        square_meters: design.square_meters,
      },
      userType: isGuest ? "guest" : "registered",
      user_id: userId,
    };

    // Send internal notification to admin using new template
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

    // Send auto-reply to user using new template
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

    // Revalidate the path if needed
    revalidatePath("/admin/inquiries");

    return {
      success: true,
      data: {
        id: inquiry._id.toString(),
        user_id: userId || null,
        userType: isGuest ? "guest" : "registered",
      },
    };
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// NEW: Get user-specific notifications with dynamic user ID handling
export async function getUserNotifications(
  userEmail: string,
  user_id?: string
): Promise<{
  success: boolean;
  notifications?: any[];
  error?: string;
}> {
  await dbConnect();

  try {
    // Build query: for registered users, query by userId (user_id) OR email; for guests, query by email only
    const query = user_id
      ? { $or: [{ userId: user_id }, { userEmail: userEmail }] }
      : { userEmail: userEmail };

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Fetch design details for each notification
    const notificationsWithDesigns = await Promise.all(
      notifications.map(async (n) => {
        const design = await DesignModel.findOne({ design_id: n.design.id });
        return {
          _id: (n as any)._id.toString(),
          userEmail: n.userEmail,
          userId: n.userId, // This will now be the user_id (GC-0007)
          design: {
            id: n.design.id,
            name: n.design.name,
            price: n.design.price,
            square_meters: n.design.square_meters,
            images: design?.images || [],
            isLoanOffer: design?.isLoanOffer,
            maxLoanYears: design?.maxLoanTerm
              ? Math.floor(design.maxLoanTerm / 12)
              : n.design.maxLoanYears,
            interestRate: design?.interestRate || n.design.interestRate,
          },
          inquiryDetails: {
            name: n.inquiryDetails.name,
            email: n.inquiryDetails.email,
            phone: n.inquiryDetails.phone,
            message: n.inquiryDetails.message,
            preferredDate: n.inquiryDetails.preferredDate,
            preferredTime: n.inquiryDetails.preferredTime,
            meetingType: n.inquiryDetails.meetingType,
          },
          isGuest: n.isGuest,
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          timeAgo: getTimeAgo(n.createdAt), // Add time ago for display
        };
      })
    );

    return {
      success: true,
      notifications: notificationsWithDesigns,
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
    };
  }
}

// NEW: Helper function to get time ago string
function getTimeAgo(date: Date): string {
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

// Update the getNotifications function for admin (all notifications)
export async function getNotifications(): Promise<NotificationResponse> {
  await dbConnect();
  try {
    const notifications = await NotificationModel.find().sort({
      createdAt: -1,
    });

    // Fetch design details for each notification to get images
    const notificationsWithDesigns = await Promise.all(
      notifications.map(async (n) => {
        const design = await DesignModel.findOne({ design_id: n.design.id });
        return {
          _id: n._id.toString(),
          userEmail: n.userEmail,
          userId: n.userId, // Include userId in admin response (now as GC-0007)
          design: {
            id: n.design.id,
            name: n.design.name,
            price: n.design.price,
            square_meters: n.design.square_meters,
            images: design?.images || [],
            isLoanOffer: design?.isLoanOffer,
            maxLoanYears: design?.maxLoanTerm
              ? Math.floor(design.maxLoanTerm / 12)
              : n.design.maxLoanYears,
            interestRate: design?.interestRate || n.design.interestRate,
          },
          inquiryDetails: {
            name: n.inquiryDetails.name,
            email: n.inquiryDetails.email,
            phone: n.inquiryDetails.phone,
            message: n.inquiryDetails.message,
            preferredDate: n.inquiryDetails.preferredDate,
            preferredTime: n.inquiryDetails.preferredTime,
            meetingType: n.inquiryDetails.meetingType,
          },
          isGuest: n.isGuest,
          type: n.type,
          createdAt: n.createdAt.toISOString(),
          isRead: n.isRead,
        };
      })
    );

    return {
      success: true,
      notifications: notificationsWithDesigns,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
      notifications: [],
    };
  }
}

// Update markNotificationAsRead to work with user-specific notifications
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();
  try {
    const notification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return { success: false, error: "Notification not found" };
    }
    revalidatePath("/admin/notifications");
    revalidatePath("/user/userdashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// NEW: Mark all notifications as read for a specific user
export async function markAllNotificationsAsRead(
  userEmail: string,
  user_id?: string
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  try {
    // Build query same as getUserNotifications
    const query = user_id
      ? { $or: [{ userId: user_id }, { userEmail: userEmail }], isRead: false }
      : { userEmail: userEmail, isRead: false };

    await NotificationModel.updateMany(query, { isRead: true });

    revalidatePath("/user/userdashboard");
    revalidatePath("/admin/notifications");

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
    };
  }
}

// Keep all other existing functions unchanged below...
export async function deleteNotification(notificationId: string) {
  try {
    await dbConnect();
    const result = await NotificationModel.deleteOne({ _id: notificationId });
    if (result.deletedCount === 0) {
      throw new Error("Notification not found or already deleted");
    }
    revalidatePath("/admin/notifications");
    return { success: true };
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

export async function clearAllNotifications() {
  try {
    await dbConnect();
    const result = await NotificationModel.deleteMany({});
    if (result.deletedCount === 0) {
      throw new Error("No notifications to clear");
    }
    revalidatePath("/admin/notifications");
    return { success: true };
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

export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  try {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    revalidatePath("/admin/notifications");
    revalidatePath("/user/userdashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

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
