// actions/appointments.ts - UPDATED WITH HELPER FUNCTIONS
"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { Inquiry } from "@/models/Inquiry";
import { Timeslot } from "@/models/Timeslots";
import User from "@/models/User";
import { sendEmail } from "@/lib/nodemailer";
import { generateEmailTemplate, EmailTemplates } from "@/lib/email-templates";
import {
  notificationService,
  createAppointmentNotification,
} from "@/lib/notification-services";
import { InquiryActionResponse, InquiriesResponse } from "@/types/inquiry";
import {
  TimeslotsResponse,
  AvailabilityResponse,
  TimeslotResponse,
  AvailabilitySettings,
} from "@/types/timeslot";

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

    // Also create notification for admin
    await createAppointmentNotification(
      {
        inquiryId: inquiry._id,
        userId: inquiry.user_id,
        userEmail: inquiry.email,
        userName: inquiry.name,
        userFirstName: inquiry.name.split(" ")[0],
        userLastName: inquiry.name.split(" ").slice(1).join(" "),
        designName: inquiry.design.name,
        originalDate: inquiry.preferredDate,
        originalTime: inquiry.preferredTime,
        meetingType: inquiry.meetingType,
        userType: inquiry.userType || "guest",
      },
      "inquiry_submitted",
      "New Consultation Inquiry",
      `${inquiry.name} has submitted a new inquiry for ${inquiry.design.name}`,
      {
        phone: inquiry.phone,
        message: inquiry.message,
      }
    );
  } catch (error) {
    console.error("Error sending new inquiry notification:", error);
  }
}

// Complete inquiry - UPDATED WITH HELPER FUNCTION
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

    // UPDATED: Use helper function for notifications
    await Promise.all([
      sendAppointmentEmail("completed", transformedInquiry),
      // Create notification using helper function
      createAppointmentNotification(
        {
          inquiryId: inquiry._id?.toString(),
          appointmentId: inquiry._id?.toString(),
          userId: inquiry.user_id,
          userEmail: inquiry.email,
          userName: inquiry.name,
          userFirstName: inquiry.name.split(" ")[0],
          userLastName: inquiry.name.split(" ").slice(1).join(" "),
          designName: inquiry.design.name,
          originalDate: inquiry.preferredDate,
          originalTime: inquiry.preferredTime,
          meetingType: inquiry.meetingType,
          userType: userType,
        },
        "appointment_completed",
        "Consultation Completed",
        `Your consultation for ${transformedInquiry.design.name} has been completed. Thank you for choosing GianConstruct!`
      ),
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

// Confirm inquiry and book timeslot - UPDATED WITH HELPER FUNCTION
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

    // UPDATED: Use helper function for notifications
    await Promise.all([
      sendAppointmentEmail("confirmed", transformedInquiry),
      // Create notification using helper function
      createAppointmentNotification(
        {
          inquiryId: inquiry._id?.toString(),
          appointmentId: inquiry._id?.toString(),
          userId: inquiry.user_id,
          userEmail: inquiry.email,
          userName: inquiry.name,
          userFirstName: inquiry.name.split(" ")[0],
          userLastName: inquiry.name.split(" ").slice(1).join(" "),
          designName: inquiry.design.name,
          originalDate: inquiry.preferredDate,
          originalTime: inquiry.preferredTime,
          meetingType: inquiry.meetingType,
          userType: userType,
        },
        "appointment_confirmed",
        "Appointment Confirmed",
        `Your appointment for ${transformedInquiry.design.name} has been confirmed for ${inquiry.preferredDate} at ${inquiry.preferredTime}`
      ),
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

// Cancel inquiry and free up timeslot - UPDATED WITH HELPER FUNCTION
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

    // UPDATED: Use helper function for notifications
    await Promise.all([
      sendAppointmentEmail("cancelled", transformedInquiry, { reason }),
      // Create notification using helper function
      createAppointmentNotification(
        {
          inquiryId: inquiry._id?.toString(),
          appointmentId: inquiry._id?.toString(),
          userId: inquiry.user_id,
          userEmail: inquiry.email,
          userName: inquiry.name,
          userFirstName: inquiry.name.split(" ")[0],
          userLastName: inquiry.name.split(" ").slice(1).join(" "),
          designName: inquiry.design.name,
          originalDate: inquiry.preferredDate,
          originalTime: inquiry.preferredTime,
          meetingType: inquiry.meetingType,
          userType: userType,
          reason: reason,
        },
        "appointment_cancelled",
        "Appointment Cancelled",
        `Your appointment for ${transformedInquiry.design.name} has been cancelled${reason ? `: ${reason}` : ""}`
      ),
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

// Reschedule inquiry and update timeslots - UPDATED WITH HELPER FUNCTION
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

    // UPDATED: Use helper function for notifications
    await Promise.all([
      sendAppointmentEmail("rescheduled", transformedInquiry, {
        newDate,
        newTime,
        notes,
      }),
      // Create notification using helper function
      createAppointmentNotification(
        {
          inquiryId: inquiry._id?.toString(),
          appointmentId: inquiry._id?.toString(),
          userId: inquiry.user_id,
          userEmail: inquiry.email,
          userName: inquiry.name,
          userFirstName: inquiry.name.split(" ")[0],
          userLastName: inquiry.name.split(" ").slice(1).join(" "),
          designName: inquiry.design.name,
          originalDate: inquiry.preferredDate,
          originalTime: inquiry.preferredTime,
          newDate: newDate,
          newTime: newTime,
          meetingType: inquiry.meetingType,
          userType: userType,
          notes: notes,
        },
        "appointment_rescheduled",
        "Appointment Rescheduled",
        `Your appointment for ${transformedInquiry.design.name} has been rescheduled to ${newDate} at ${newTime}`
      ),
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

    // Include both confirmed AND rescheduled appointments in upcoming count
    const upcomingCount = inquiries.filter(
      (inquiry) =>
        (inquiry.status === "confirmed" || inquiry.status === "rescheduled") &&
        inquiry.preferredDate >= today
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

export async function cancelUserInquiry(
  inquiryId: string
): Promise<InquiryActionResponse> {
  await dbConnect();

  try {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return { success: false, error: "Appointment not found" };
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
        cancellationReason: "Cancelled by user",
      },
      { new: true }
    );

    if (!updatedInquiry) {
      return { success: false, error: "Failed to cancel appointment" };
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

    // Send email notification
    await sendAppointmentEmail("cancelled", transformedInquiry, {
      reason: "Cancelled by user",
    });

    // Create notification
    await createAppointmentNotification(
      {
        inquiryId: inquiry._id?.toString(),
        appointmentId: inquiry._id?.toString(),
        userId: inquiry.user_id,
        userEmail: inquiry.email,
        userName: inquiry.name,
        userFirstName: inquiry.name.split(" ")[0],
        userLastName: inquiry.name.split(" ").slice(1).join(" "),
        designName: inquiry.design.name,
        originalDate: inquiry.preferredDate,
        originalTime: inquiry.preferredTime,
        meetingType: inquiry.meetingType,
        userType: userType,
        reason: "Cancelled by user",
      },
      "appointment_cancelled",
      "Appointment Cancelled",
      `Your appointment for ${transformedInquiry.design.name} has been cancelled`
    );

    revalidatePath("/user/appointments");
    revalidatePath("/admin/appointments");

    return {
      success: true,
      inquiry: transformedInquiry,
    };
  } catch (error) {
    console.error("Error cancelling inquiry from user side:", error);
    return { success: false, error: "Failed to cancel appointment" };
  }
}
