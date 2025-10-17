"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { Inquiry } from "@/models/Inquiry";
import { Timeslot } from "@/models/Timeslots";
import User from "@/models/User";
import { sendEmail } from "@/lib/nodemailer";
import NotificationModel from "@/models/Notification";
import { InquiryActionResponse, InquiriesResponse } from "@/types/inquiry";
import {
  TimeslotsResponse,
  AvailabilityResponse,
  TimeslotResponse,
  AvailabilitySettings,
} from "@/types/timeslot";
import { generateEmailTemplate, EmailTemplates } from "@/lib/email-templates";

// Get all inquiries
export async function getInquiries(): Promise<InquiriesResponse> {
  await dbConnect();

  try {
    const inquiries = await Inquiry.find().sort({ submittedAt: -1 }).lean();

    const transformedInquiries = await Promise.all(
      inquiries.map(async (inquiry) => {
        const user = await User.findOne({ email: inquiry.email });
        const isGuest = !user || (user && user.role !== "user");
        const userType: "guest" | "registered" = isGuest
          ? "guest"
          : "registered";

        return {
          _id: inquiry._id.toString(),
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          message: inquiry.message,
          preferredDate: inquiry.preferredDate,
          preferredTime: inquiry.preferredTime,
          meetingType: inquiry.meetingType as "phone" | "onsite" | "video",
          design: {
            id: inquiry.design.id,
            name: inquiry.design.name,
            price: (inquiry.design as any).price,
            square_meters: (inquiry.design as any).square_meters,
          },
          submittedAt: inquiry.submittedAt,
          status: inquiry.status as
            | "pending"
            | "confirmed"
            | "cancelled"
            | "rescheduled"
            | "completed",
          notes: (inquiry as any).notes,
          cancellationReason: (inquiry as any).cancellationReason,
          rescheduleNotes: (inquiry as any).rescheduleNotes,
          userType: userType,
          userRole: user?.role || "guest",
          user_id: inquiry.user_id,
        };
      })
    );

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

// Enhanced notification helper for registered users only
async function createNotification(
  inquiry: any,
  type: "confirmed" | "cancelled" | "rescheduled" | "completed",
  additionalData?: {
    newDate?: string;
    newTime?: string;
    reason?: string;
    notes?: string;
  }
) {
  try {
    let userId: string | undefined = undefined;

    // Only create notifications for registered users
    if (inquiry.user_id) {
      // If user_id is provided in inquiry, use it directly
      const user = await User.findOne({ user_id: inquiry.user_id });
      if (user && user.role === "user") {
        userId = inquiry.user_id; // Use the user_id (GC-0007) directly
      }
    } else {
      // Fallback to finding by email
      const user = await User.findOne({ email: inquiry.email });
      if (user && user.role === "user") {
        userId = user.user_id; // Use the user_id (GC-0007)
      }
    }

    // Only create notification if user is registered
    if (!userId) {
      console.log("No registered user found - skipping notification creation");
      return;
    }

    // Map action types to notification types
    const notificationTypeMap = {
      confirmed: "appointment_confirmed",
      cancelled: "appointment_cancelled",
      rescheduled: "appointment_rescheduled",
      completed: "appointment_completed",
    };

    const notificationData: any = {
      userId: userId,
      userEmail: inquiry.email,
      design: {
        id: inquiry.design.id,
        name: inquiry.design.name,
        price: inquiry.design.price,
        square_meters: inquiry.design.square_meters,
      },
      inquiryDetails: {
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        message: inquiry.message,
        preferredDate: inquiry.preferredDate,
        preferredTime: inquiry.preferredTime,
        meetingType: inquiry.meetingType,
      },
      isGuest: false,
      isRead: false,
      type: notificationTypeMap[type],
      metadata: {
        inquiryId: inquiry._id,
        appointmentId: inquiry._id,
      },
    };

    // Add additional metadata based on type
    if (type === "cancelled" && additionalData?.reason) {
      notificationData.metadata.reason = additionalData.reason;
    }

    if (type === "rescheduled") {
      notificationData.metadata.originalDate = inquiry.preferredDate;
      notificationData.metadata.originalTime = inquiry.preferredTime;
      notificationData.metadata.notes = additionalData?.notes;
      notificationData.metadata.newDate = additionalData?.newDate;
      notificationData.metadata.newTime = additionalData?.newTime;
    }

    const notification = new NotificationModel(notificationData);
    await notification.save();

    revalidatePath("/admin/notifications");
    revalidatePath("/user/userdashboard");

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw error - notification failure shouldn't break the main operation
  }
}

// Function to get notifications for a specific registered user
export async function getUserNotifications(user_id: string): Promise<{
  success: boolean;
  notifications?: any[];
  error?: string;
}> {
  await dbConnect();

  try {
    // Only fetch notifications for registered users by user_id
    const query = { userId: user_id };

    console.log("Fetching notifications for user:", user_id);

    const notifications = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    console.log(
      `Found ${notifications.length} notifications for user ${user_id}`
    );

    const transformedNotifications = notifications.map((notification) => ({
      id: String(notification._id),
      userId: notification.userId,
      userEmail: notification.userEmail,
      type: notification.type,
      title: getNotificationTitle(notification.type),
      message: getNotificationMessage(notification),
      design: notification.design,
      inquiryDetails: notification.inquiryDetails,
      isRead: notification.isRead,
      isGuest: notification.isGuest,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      timeAgo: getTimeAgo(notification.createdAt),
    }));

    return {
      success: true,
      notifications: transformedNotifications,
    };
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return {
      success: false,
      error: "Failed to fetch notifications",
    };
  }
}

// Function to mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await dbConnect();

  try {
    await NotificationModel.findByIdAndUpdate(notificationId, { isRead: true });

    revalidatePath("/user/userdashboard");
    revalidatePath("/admin/notifications");

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: "Failed to mark notification as read",
    };
  }
}

// Function to mark all notifications as read for a user
export async function markAllNotificationsAsRead(user_id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await dbConnect();

  try {
    // Only mark notifications for registered users by user_id
    const query = { userId: user_id, isRead: false };

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

// Helper function to get notification title based on type
function getNotificationTitle(type: string): string {
  const titles = {
    appointment_confirmed: "Appointment Confirmed",
    appointment_cancelled: "Appointment Cancelled",
    appointment_rescheduled: "Appointment Rescheduled",
    appointment_completed: "Consultation Completed",
    inquiry_submitted: "Inquiry Submitted",
  };

  return titles[type as keyof typeof titles] || "Notification";
}

// Helper function to get notification message
function getNotificationMessage(notification: any): string {
  const designName = notification.design.name;

  switch (notification.type) {
    case "appointment_confirmed":
      return `Your appointment for ${designName} has been confirmed`;
    case "appointment_cancelled":
      const reason = notification.metadata?.reason
        ? `: ${notification.metadata.reason}`
        : "";
      return `Your appointment for ${designName} has been cancelled${reason}`;
    case "appointment_rescheduled":
      return `Your appointment for ${designName} has been rescheduled`;
    case "appointment_completed":
      return `Your consultation for ${designName} has been completed`;
    case "inquiry_submitted":
      return `Your inquiry for ${designName} has been submitted`;
    default:
      return `Update regarding your ${designName} inquiry`;
  }
}

// Helper function to get time ago string
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

// Professional email notification helper using the new template system
async function sendAppointmentEmail(
  type: "confirmed" | "cancelled" | "rescheduled" | "completed",
  inquiry: any,
  additionalData?: {
    newDate?: string;
    newTime?: string;
    reason?: string;
    notes?: string;
  }
) {
  try {
    let clientTemplate: any;
    let internalTemplate: any;

    // Generate client email template
    switch (type) {
      case "confirmed":
        clientTemplate = EmailTemplates.appointmentConfirmed(
          inquiry,
          formatDate,
          formatTime
        );
        break;
      case "cancelled":
        clientTemplate = EmailTemplates.appointmentCancelled(
          inquiry,
          formatDate,
          formatTime,
          additionalData?.reason
        );
        break;
      case "rescheduled":
        clientTemplate = EmailTemplates.appointmentRescheduled(
          inquiry,
          formatDate,
          formatTime,
          additionalData?.newDate,
          additionalData?.newTime,
          additionalData?.notes
        );
        break;
      case "completed":
        clientTemplate = EmailTemplates.appointmentCompleted(
          inquiry,
          formatDate,
          formatTime
        );
        break;
    }

    // Send to client
    await sendEmail({
      to: inquiry.email,
      subject: clientTemplate.subject,
      html: generateEmailTemplate(clientTemplate.data),
    });

    // Generate and send internal notification
    internalTemplate = EmailTemplates.internalAppointmentUpdate(
      inquiry,
      type,
      formatDate,
      formatTime,
      additionalData
    );

    const adminEmail = process.env.COMPANY_EMAIL || "admin@gianconstruct.com";
    await sendEmail({
      to: adminEmail,
      subject: internalTemplate.subject,
      html: generateEmailTemplate(internalTemplate.data),
    });
  } catch (error) {
    console.error("Error sending appointment email:", error);
  }
}

// Send new inquiry notification to admin using the new template system
export async function sendNewInquiryNotification(inquiry: any) {
  try {
    const template = EmailTemplates.internalNewInquiry(
      inquiry,
      formatDate,
      formatTime
    );

    const adminEmail = process.env.COMPANY_EMAIL || "admin@gianconstruct.com";

    await sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: generateEmailTemplate(template.data),
    });
  } catch (error) {
    console.error("Error sending new inquiry notification:", error);
  }
}

// Complete inquiry
export async function completeInquiry(
  inquiryId: string
): Promise<InquiryActionResponse> {
  await dbConnect();

  try {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return { success: false, error: "Inquiry not found" };
    }

    const user = await User.findOne({ email: inquiry.email });
    const isGuest = !user || (user && user.role !== "user");
    const userType: "guest" | "registered" = isGuest ? "guest" : "registered";

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status: "completed" },
      { new: true }
    );

    if (!updatedInquiry) {
      return { success: false, error: "Failed to update inquiry" };
    }

    const transformedInquiry = {
      _id: updatedInquiry._id.toString(),
      name: updatedInquiry.name,
      email: updatedInquiry.email,
      phone: updatedInquiry.phone,
      message: updatedInquiry.message,
      preferredDate: updatedInquiry.preferredDate,
      preferredTime: updatedInquiry.preferredTime,
      meetingType: updatedInquiry.meetingType as "phone" | "onsite" | "video",
      design: {
        id: updatedInquiry.design.id,
        name: updatedInquiry.design.name,
        price: (updatedInquiry.design as any).price,
        square_meters: (updatedInquiry.design as any).square_meters,
      },
      submittedAt: updatedInquiry.submittedAt,
      status: updatedInquiry.status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "rescheduled"
        | "completed",
      notes: (updatedInquiry as any).notes,
      cancellationReason: (updatedInquiry as any).cancellationReason,
      rescheduleNotes: (updatedInquiry as any).rescheduleNotes,
      userType: userType,
      userRole: user?.role || "guest",
      user_id: inquiry.user_id,
    };

    // Send email and create notification (only for registered users)
    await Promise.all([
      sendAppointmentEmail("completed", transformedInquiry),
      createNotification(transformedInquiry, "completed"),
    ]);

    revalidatePath("/admin/appointments");
    return {
      success: true,
      inquiry: transformedInquiry,
    };
  } catch (error) {
    console.error("Error completing inquiry:", error);
    return { success: false, error: "Failed to complete inquiry" };
  }
}

// Confirm inquiry and book timeslot
export async function confirmInquiry(
  inquiryId: string
): Promise<InquiryActionResponse> {
  await dbConnect();

  try {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return { success: false, error: "Inquiry not found" };
    }

    const user = await User.findOne({ email: inquiry.email });
    const isGuest = !user || (user && user.role !== "user");
    const userType: "guest" | "registered" = isGuest ? "guest" : "registered";

    // Check if timeslot is already taken
    const existingTimeslot = await Timeslot.findOne({
      date: inquiry.preferredDate,
      time: inquiry.preferredTime,
      isAvailable: false,
    });

    if (existingTimeslot) {
      return { success: false, error: "This time slot is already booked" };
    }

    // Update or create timeslot
    await Timeslot.findOneAndUpdate(
      { date: inquiry.preferredDate, time: inquiry.preferredTime },
      {
        isAvailable: false,
        inquiryId: inquiry._id,
        meetingType: inquiry.meetingType,
        updatedAt: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    // Update inquiry status
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status: "confirmed" },
      { new: true }
    );

    if (!updatedInquiry) {
      return { success: false, error: "Failed to update inquiry" };
    }

    const transformedInquiry = {
      _id: updatedInquiry._id.toString(),
      name: updatedInquiry.name,
      email: updatedInquiry.email,
      phone: updatedInquiry.phone,
      message: updatedInquiry.message,
      preferredDate: updatedInquiry.preferredDate,
      preferredTime: updatedInquiry.preferredTime,
      meetingType: updatedInquiry.meetingType as "phone" | "onsite" | "video",
      design: {
        id: updatedInquiry.design.id,
        name: updatedInquiry.design.name,
        price: (updatedInquiry.design as any).price,
        square_meters: (updatedInquiry.design as any).square_meters,
      },
      submittedAt: updatedInquiry.submittedAt,
      status: updatedInquiry.status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "rescheduled"
        | "completed",
      notes: (updatedInquiry as any).notes,
      cancellationReason: (updatedInquiry as any).cancellationReason,
      rescheduleNotes: (updatedInquiry as any).rescheduleNotes,
      userType: userType,
      userRole: user?.role || "guest",
      user_id: inquiry.user_id,
    };

    // Send email and create notification (only for registered users)
    await Promise.all([
      sendAppointmentEmail("confirmed", transformedInquiry),
      createNotification(transformedInquiry, "confirmed"),
    ]);

    revalidatePath("/admin/appointments");
    return {
      success: true,
      inquiry: transformedInquiry,
    };
  } catch (error) {
    console.error("Error confirming inquiry:", error);
    return { success: false, error: "Failed to confirm inquiry" };
  }
}

// Cancel inquiry and free up timeslot
export async function cancelInquiry(
  inquiryId: string,
  reason: string
): Promise<InquiryActionResponse> {
  await dbConnect();

  try {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return { success: false, error: "Inquiry not found" };
    }

    const user = await User.findOne({ email: inquiry.email });
    const isGuest = !user || (user && user.role !== "user");
    const userType: "guest" | "registered" = isGuest ? "guest" : "registered";

    // Free up the timeslot
    await Timeslot.findOneAndUpdate(
      { date: inquiry.preferredDate, time: inquiry.preferredTime },
      {
        isAvailable: true,
        inquiryId: null,
        meetingType: null,
        updatedAt: new Date().toISOString(),
      }
    );

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      {
        status: "cancelled",
        cancellationReason: reason,
      },
      { new: true }
    );

    if (!updatedInquiry) {
      return { success: false, error: "Failed to update inquiry" };
    }

    const transformedInquiry = {
      _id: updatedInquiry._id.toString(),
      name: updatedInquiry.name,
      email: updatedInquiry.email,
      phone: updatedInquiry.phone,
      message: updatedInquiry.message,
      preferredDate: updatedInquiry.preferredDate,
      preferredTime: updatedInquiry.preferredTime,
      meetingType: updatedInquiry.meetingType as "phone" | "onsite" | "video",
      design: {
        id: updatedInquiry.design.id,
        name: updatedInquiry.design.name,
        price: (updatedInquiry.design as any).price,
        square_meters: (updatedInquiry.design as any).square_meters,
      },
      submittedAt: updatedInquiry.submittedAt,
      status: updatedInquiry.status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "rescheduled"
        | "completed",
      notes: (updatedInquiry as any).notes,
      cancellationReason: (updatedInquiry as any).cancellationReason,
      rescheduleNotes: (updatedInquiry as any).rescheduleNotes,
      userType: userType,
      userRole: user?.role || "guest",
      user_id: inquiry.user_id,
    };

    // Send email and create notification (only for registered users)
    await Promise.all([
      sendAppointmentEmail("cancelled", transformedInquiry, { reason }),
      createNotification(transformedInquiry, "cancelled", { reason }),
    ]);

    revalidatePath("/admin/appointments");
    return {
      success: true,
      inquiry: transformedInquiry,
    };
  } catch (error) {
    console.error("Error cancelling inquiry:", error);
    return { success: false, error: "Failed to cancel inquiry" };
  }
}

// Reschedule inquiry and update timeslots
export async function rescheduleInquiry(
  inquiryId: string,
  newDate: string,
  newTime: string,
  notes?: string
): Promise<InquiryActionResponse> {
  await dbConnect();

  try {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return { success: false, error: "Inquiry not found" };
    }

    const user = await User.findOne({ email: inquiry.email });
    const isGuest = !user || (user && user.role !== "user");
    const userType: "guest" | "registered" = isGuest ? "guest" : "registered";

    // Check if new timeslot is available
    const existingTimeslot = await Timeslot.findOne({
      date: newDate,
      time: newTime,
      isAvailable: false,
    });

    if (existingTimeslot) {
      return {
        success: false,
        error: "The selected time slot is already booked",
      };
    }

    // Free up old timeslot
    await Timeslot.findOneAndUpdate(
      { date: inquiry.preferredDate, time: inquiry.preferredTime },
      {
        isAvailable: true,
        inquiryId: null,
        meetingType: null,
        updatedAt: new Date().toISOString(),
      }
    );

    // Book new timeslot
    await Timeslot.findOneAndUpdate(
      { date: newDate, time: newTime },
      {
        isAvailable: false,
        inquiryId: inquiry._id,
        meetingType: inquiry.meetingType,
        updatedAt: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    const updateData: any = {
      status: "rescheduled",
      preferredDate: newDate,
      preferredTime: newTime,
    };

    if (notes) updateData.rescheduleNotes = notes;

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      updateData,
      { new: true }
    );

    if (!updatedInquiry) {
      return { success: false, error: "Failed to update inquiry" };
    }

    const transformedInquiry = {
      _id: updatedInquiry._id.toString(),
      name: updatedInquiry.name,
      email: updatedInquiry.email,
      phone: updatedInquiry.phone,
      message: updatedInquiry.message,
      preferredDate: updatedInquiry.preferredDate,
      preferredTime: updatedInquiry.preferredTime,
      meetingType: updatedInquiry.meetingType as "phone" | "onsite" | "video",
      design: {
        id: updatedInquiry.design.id,
        name: updatedInquiry.design.name,
        price: (updatedInquiry.design as any).price,
        square_meters: (updatedInquiry.design as any).square_meters,
      },
      submittedAt: updatedInquiry.submittedAt,
      status: updatedInquiry.status as
        | "pending"
        | "confirmed"
        | "cancelled"
        | "rescheduled"
        | "completed",
      notes: (updatedInquiry as any).notes,
      cancellationReason: (updatedInquiry as any).cancellationReason,
      rescheduleNotes: (updatedInquiry as any).rescheduleNotes,
      userType: userType,
      userRole: user?.role || "guest",
      user_id: inquiry.user_id,
    };

    // Send email and create notification (only for registered users)
    await Promise.all([
      sendAppointmentEmail("rescheduled", transformedInquiry, {
        newDate,
        newTime,
        notes,
      }),
      createNotification(transformedInquiry, "rescheduled", {
        newDate,
        newTime,
        notes,
      }),
    ]);

    revalidatePath("/admin/appointments");
    return {
      success: true,
      inquiry: transformedInquiry,
    };
  } catch (error) {
    console.error("Error rescheduling inquiry:", error);
    return { success: false, error: "Failed to reschedule inquiry" };
  }
}

// Get available timeslots for a specific date
export async function getAvailableTimeslots(
  date: string
): Promise<TimeslotResponse> {
  await dbConnect();

  try {
    const timeslots = await Timeslot.find({
      date,
      isAvailable: true,
    }).sort({ time: 1 });

    const uniqueTimes = new Map();
    timeslots.forEach((slot) => {
      if (!uniqueTimes.has(slot.time)) {
        uniqueTimes.set(slot.time, slot);
      }
    });

    const uniqueTimeslots = Array.from(uniqueTimes.values());

    return {
      success: true,
      timeslots: uniqueTimeslots.map((slot) => ({
        value: slot.time,
        label: formatTimeDisplay(slot.time),
        enabled: true,
      })),
    };
  } catch (error) {
    console.error("Error fetching timeslots:", error);
    return { success: false, error: "Failed to fetch available timeslots" };
  }
}

// Get all timeslots with filters
export async function getTimeslots(
  filters: any = {}
): Promise<TimeslotsResponse> {
  await dbConnect();

  try {
    const timeslots = await Timeslot.find(filters)
      .sort({ date: 1, time: 1 })
      .lean();

    const transformedTimeslots = timeslots.map((slot) => ({
      _id: slot._id.toString(),
      date: slot.date,
      time: slot.time,
      isAvailable: slot.isAvailable,
      inquiryId: slot.inquiryId ? slot.inquiryId.toString() : undefined,
      meetingType: slot.meetingType as "phone" | "onsite" | "video" | undefined,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));

    return {
      success: true,
      timeslots: transformedTimeslots,
    };
  } catch (error) {
    console.error("Error fetching timeslots:", error);
    return { success: false, error: "Failed to fetch timeslots" };
  }
}

export async function initializeTimeslots(
  startDate: string,
  endDate: string,
  settings: AvailabilitySettings
): Promise<AvailabilityResponse> {
  await dbConnect();

  try {
    const timeslots = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    await Timeslot.deleteMany({
      date: { $gte: startDate, $lte: endDate },
      isAvailable: true,
    });

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      if (settings.workingDays.includes(dayOfWeek)) {
        const dateStr = currentDate.toISOString().split("T")[0];

        const [startHour, startMinute] = settings.startTime
          .split(":")
          .map(Number);
        const [endHour, endMinute] = settings.endTime.split(":").map(Number);

        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        for (
          let minutes = startTotalMinutes;
          minutes < endTotalMinutes;
          minutes += settings.slotDuration
        ) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          const timeValue = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

          const isDuringBreak = settings.breaks.some((breakTime) => {
            const [breakStartHour, breakStartMinute] = breakTime.start
              .split(":")
              .map(Number);
            const [breakEndHour, breakEndMinute] = breakTime.end
              .split(":")
              .map(Number);
            const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
            const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

            return minutes >= breakStartMinutes && minutes < breakEndMinutes;
          });

          if (!isDuringBreak) {
            timeslots.push({
              date: dateStr,
              time: timeValue,
              isAvailable: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (timeslots.length > 0) {
      await Timeslot.insertMany(timeslots, { ordered: false });
    }

    return {
      success: true,
      message: `Initialized ${timeslots.length} timeslots for ${settings.workingDays.length} working days with ${settings.slotDuration}-minute slots`,
    };
  } catch (error) {
    console.error("Error initializing timeslots:", error);
    return { success: false, error: "Failed to initialize timeslots" };
  }
}

// Update availability settings
export async function updateAvailability(
  settings: AvailabilitySettings
): Promise<AvailabilityResponse> {
  await dbConnect();

  try {
    return { success: true };
  } catch (error) {
    console.error("Error updating availability:", error);
    return { success: false, error: "Failed to update availability settings" };
  }
}

// Helper function to format time for display
function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Delete multiple inquiries
export async function deleteInquiries(
  inquiryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  try {
    if (!inquiryIds || !Array.isArray(inquiryIds) || inquiryIds.length === 0) {
      return { success: false, error: "No inquiry IDs provided" };
    }

    const result = await Inquiry.deleteMany({ _id: { $in: inquiryIds } });

    if (result.deletedCount === 0) {
      return { success: false, error: "No inquiries found to delete" };
    }

    revalidatePath("/admin/appointments");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting inquiries:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting inquiries",
    };
  }
}

// Cleanup timeslots for non-working days
export async function cleanupTimeslots(
  workingDays: number[]
): Promise<AvailabilityResponse> {
  await dbConnect();

  try {
    const today = new Date().toISOString().split("T")[0];
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    const endDate = twoWeeksFromNow.toISOString().split("T")[0];

    const timeslotsToDelete = await Timeslot.find({
      date: { $gte: today, $lte: endDate },
      isAvailable: true,
    });

    let deletedCount = 0;

    for (const timeslot of timeslotsToDelete) {
      const date = new Date(timeslot.date);
      const dayOfWeek = date.getDay();

      if (!workingDays.includes(dayOfWeek)) {
        await Timeslot.findByIdAndDelete(timeslot._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      message: `Cleaned up ${deletedCount} timeslots from non-working days`,
    };
  } catch (error) {
    console.error("Error cleaning up timeslots:", error);
    return { success: false, error: "Failed to cleanup timeslots" };
  }
}

// Update timeslots when duration changes
export async function updateTimeslotsForNewDuration(
  settings: AvailabilitySettings
): Promise<AvailabilityResponse> {
  await dbConnect();

  try {
    const today = new Date().toISOString().split("T")[0];
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    const endDate = twoWeeksFromNow.toISOString().split("T")[0];

    await Timeslot.deleteMany({
      date: { $gte: today, $lte: endDate },
      isAvailable: true,
    });

    return await initializeTimeslots(today, endDate, settings);
  } catch (error) {
    console.error("Error updating timeslots for new duration:", error);
    return {
      success: false,
      error: "Failed to update timeslots for new duration",
    };
  }
}

// Get appointment statistics for badges and counts
export async function getAppointmentStats(): Promise<{
  success: boolean;
  stats?: {
    pendingCount: number;
    upcomingCount: number;
    confirmedCount: number;
    cancelledCount: number;
    rescheduledCount: number;
    completedCount: number;
    totalCount: number;
  };
  error?: string;
}> {
  await dbConnect();

  try {
    const inquiries = await Inquiry.find().sort({ submittedAt: -1 }).lean();

    const today = new Date().toISOString().split("T")[0];

    // Calculate counts for each status
    const pendingCount = inquiries.filter(
      (inquiry) => inquiry.status === "pending"
    ).length;

    const upcomingCount = inquiries.filter(
      (inquiry) =>
        inquiry.status === "confirmed" && inquiry.preferredDate >= today
    ).length;

    const confirmedCount = inquiries.filter(
      (inquiry) => inquiry.status === "confirmed"
    ).length;
    const cancelledCount = inquiries.filter(
      (inquiry) => inquiry.status === "cancelled"
    ).length;
    const rescheduledCount = inquiries.filter(
      (inquiry) => inquiry.status === "rescheduled"
    ).length;
    const completedCount = inquiries.filter(
      (inquiry) => inquiry.status === "completed"
    ).length;
    const totalCount = inquiries.length;

    return {
      success: true,
      stats: {
        pendingCount,
        upcomingCount,
        confirmedCount,
        cancelledCount,
        rescheduledCount,
        completedCount,
        totalCount,
      },
    };
  } catch (error) {
    console.error("Error fetching appointment stats:", error);
    return {
      success: false,
      error: "Failed to fetch appointment statistics",
    };
  }
}
