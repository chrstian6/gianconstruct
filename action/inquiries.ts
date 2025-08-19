"use server";

// Import necessary modules
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import { sendEmail } from "@/lib/nodemailer"; // Adjust path to your nodemailer file
import { Inquiry, InquiryDocument } from "@/models/Inquiry"; // Adjust path as needed
import User from "@/models/User"; // Import User model
import Notification from "@/models/Notification"; // This should be NotificationModel, renamed for clarity
import DesignModel from "@/models/Design"; // Import Design model

// Rename Notification import to NotificationModel for clarity and consistency
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
    design: {
      id: string; // This should be design_id
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
    };
    isGuest: boolean;
    createdAt: string;
    isRead?: boolean; // Optional field from the Notification model
  }>;
  error?: string;
}

export async function submitInquiry(
  formData: FormData
): Promise<InquirySubmitResponse> {
  await dbConnect(); // Connect to MongoDB

  try {
    // Extract form data
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;
    const designId = formData.get("designId") as string; // This should be design_id

    // Basic validation
    if (!name || !email || !phone || !message || !designId) {
      return { success: false, error: "All fields are required" };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Fetch design details using design_id
    const design = await DesignModel.findOne({ design_id: designId }); // Changed from _id to design_id
    if (!design) {
      return { success: false, error: "Design not found" };
    }

    // Check if the email exists in the User collection
    const user = await User.findOne({ email });
    const isGuest = !user || (user && user.role !== "user");

    // Prepare inquiry data with design details
    const inquiryData = {
      name,
      email,
      phone,
      message,
      design: {
        id: design.design_id, // Use design_id instead of _id
        name: design.name,
        price: design.price,
        square_meters: design.square_meters,
      },
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    // Save to MongoDB
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();

    // Create notification if it's a guest or a user with role "user"
    if (isGuest || (user && user.role === "user")) {
      const notification = new NotificationModel({
        userEmail: email,
        design: {
          id: design.design_id, // Use design_id instead of _id
          name: design.name,
          price: design.price,
          square_meters: design.square_meters,
          images: design.images,
          isLoanOffer: design.isLoanOffer,
          maxLoanYears: design.maxLoanTerm
            ? design.maxLoanTerm / 12
            : undefined, // Convert to years if applicable
          interestRate: design.interestRate,
        },
        inquiryDetails: { name, email, phone, message },
        isGuest,
      });
      await notification.save();
      revalidatePath("/admin/notifications"); // Revalidate notifications
    }

    // Send email to company
    const companyEmail = process.env.COMPANY_EMAIL || "admin@gianconstruct.com"; // Set in .env
    const companyHtml = `
      <h2>New Inquiry Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Design:</strong> ${design.name} (ID: ${design.design_id})</p> <!-- Use design_id -->
      <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
    `;
    await sendEmail({
      to: companyEmail,
      subject: "New Inquiry from GianConstruct Website",
      html: companyHtml,
    });

    // Send auto-reply to user
    const autoReplyHtml = `
      <h2>Thank You for Your Inquiry!</h2>
      <p>Dear ${name},</p>
      <p>Thank you for reaching out regarding ${design.name}. We have received your inquiry and will get back to you within 24 hours. Here are your submitted details:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Message:</strong> ${message}</li>
      </ul>
      <p>Best regards,<br>GianConstruct Team</p>
    `;
    await sendEmail({
      to: email,
      subject: "Auto-Reply: Your Inquiry with GianConstruct",
      html: autoReplyHtml,
    });

    // Revalidate the path if needed
    revalidatePath("/admin/inquiries");

    return { success: true, data: { id: inquiry._id.toString() } };
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// Update the getNotifications function in action/inquiries.ts
export async function getNotifications(): Promise<NotificationResponse> {
  await dbConnect();
  try {
    const notifications = await NotificationModel.find().sort({
      createdAt: -1,
    });

    // Fetch design details for each notification to get images
    const notificationsWithDesigns = await Promise.all(
      notifications.map(async (n) => {
        const design = await DesignModel.findOne({ design_id: n.design.id }); // Changed from findById to findOne with design_id
        return {
          _id: n._id.toString(),
          userEmail: n.userEmail,
          design: {
            id: n.design.id, // This is design_id from the notification
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
          },
          isGuest: n.isGuest,
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
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// New action to delete a single notification
export async function deleteNotification(notificationId: string) {
  try {
    await dbConnect();
    const result = await NotificationModel.deleteOne({ _id: notificationId });
    if (result.deletedCount === 0) {
      throw new Error("Notification not found or already deleted");
    }
    revalidatePath("/admin/notifications"); // Revalidate notifications path
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

// New action to clear all notifications
export async function clearAllNotifications() {
  try {
    await dbConnect();
    const result = await NotificationModel.deleteMany({});
    if (result.deletedCount === 0) {
      throw new Error("No notifications to clear");
    }
    revalidatePath("/admin/notifications"); // Revalidate notifications path
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
