"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { Inquiry } from "@/models/Inquiry";
import { Timeslot } from "@/models/Timeslots";
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

    // Transform the data to match our TypeScript interface with proper status types
    const transformedInquiries = inquiries.map((inquiry) => ({
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

// NEW FUNCTION: Complete inquiry
export async function completeInquiry(
  inquiryId: string
): Promise<InquiryActionResponse> {
  await dbConnect();

  try {
    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) {
      return { success: false, error: "Inquiry not found" };
    }

    // Update inquiry status to completed
    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status: "completed" },
      { new: true }
    );

    if (!updatedInquiry) {
      return { success: false, error: "Failed to update inquiry" };
    }

    // Transform the response to match our interface
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
    };

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

    // Transform the response to match our interface
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
    };

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

    // Transform the response to match our interface
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
    };

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

    // Transform the response to match our interface
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
    };

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

    // Ensure unique times
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

    // Transform the data to match our TypeScript interface
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

// Initialize timeslots for a date range
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

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      // Only create timeslots for working days
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

          // Check if this time slot falls within any break
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

    // Bulk insert timeslots (ignore duplicates due to unique index)
    if (timeslots.length > 0) {
      await Timeslot.insertMany(timeslots, { ordered: false });
    }

    return {
      success: true,
      message: `Initialized ${timeslots.length} timeslots`,
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
    // You might want to store these settings in a separate collection
    // For now, we'll just return success
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

// NEW FUNCTION: Delete multiple inquiries
export async function deleteInquiries(
  inquiryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();

  try {
    // Validate input
    if (!inquiryIds || !Array.isArray(inquiryIds) || inquiryIds.length === 0) {
      return { success: false, error: "No inquiry IDs provided" };
    }

    // Delete the inquiries
    const result = await Inquiry.deleteMany({ _id: { $in: inquiryIds } });

    if (result.deletedCount === 0) {
      return { success: false, error: "No inquiries found to delete" };
    }

    // Revalidate the appointments page to reflect the changes
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
