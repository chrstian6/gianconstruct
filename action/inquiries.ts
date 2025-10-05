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
      preferredDate?: string;
      preferredTime?: string;
      meetingType?: string;
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
    // Extract form data - FIXED: Use correct field names from the form
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const name = `${firstName} ${lastName}`.trim(); // Combine first and last name
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;
    const preferredDate = formData.get("preferredDate") as string;
    const preferredTime = formData.get("preferredTime") as string;
    const meetingType = formData.get("meetingType") as string;
    const designId = formData.get("designId") as string;

    // Basic validation - FIXED: Check all required fields
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
      return { success: false, error: "All fields are required" };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Fetch design details using design_id
    const design = await DesignModel.findOne({ design_id: designId });
    if (!design) {
      return { success: false, error: "Design not found" };
    }

    // Check if the email exists in the User collection
    const user = await User.findOne({ email });
    const isGuest = !user || (user && user.role !== "user");

    // Prepare inquiry data with design details
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
    };

    // Save to MongoDB
    const inquiry = new Inquiry(inquiryData);
    await inquiry.save();

    // Prepare inquiry details for notification
    const inquiryDetails: any = {
      name,
      email,
      phone,
      message,
      preferredDate,
      preferredTime,
      meetingType,
    };

    // Create notification if it's a guest or a user with role "user"
    if (isGuest || (user && user.role === "user")) {
      const notification = new NotificationModel({
        userEmail: email,
        design: {
          id: design.design_id,
          name: design.name,
          price: design.price,
          square_meters: design.square_meters,
          images: design.images,
          isLoanOffer: design.isLoanOffer,
          maxLoanYears: design.maxLoanTerm
            ? design.maxLoanTerm / 12
            : undefined,
          interestRate: design.interestRate,
        },
        inquiryDetails: inquiryDetails,
        isGuest,
      });
      await notification.save();
      revalidatePath("/admin/notifications");
    }

    // Format date for email if available
    let formattedDate = "";
    if (preferredDate) {
      formattedDate = new Date(preferredDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Send email to company
    const companyEmail = process.env.COMPANY_EMAIL || "admin@gianconstruct.com";
    let companyHtml = `
      <h2>New Consultation Request Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong> ${message}</p>
      <h3>Appointment Details:</h3>
      <p><strong>Preferred Date:</strong> ${formattedDate}</p>
      <p><strong>Preferred Time:</strong> ${preferredTime}</p>
      <p><strong>Meeting Type:</strong> ${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)}</p>
      <p><strong>Design:</strong> ${design.name} (ID: ${design.design_id})</p>
      <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
    `;

    await sendEmail({
      to: companyEmail,
      subject: "New Consultation Request from GianConstruct Website",
      html: companyHtml,
    });

    // Send auto-reply to user
    // Send auto-reply to user
    let autoReplyHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmation - GianConstruct</title>
    <style>
        body {
            font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            color: #f97316;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #fed7aa;
            padding-bottom: 8px;
        }
        .details-grid {
            background: #fff7ed;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #f97316;
        }
        .detail-item {
            margin-bottom: 12px;
            display: flex;
        }
        .detail-label {
            font-weight: 600;
            color: #7c2d12;
            min-width: 140px;
        }
        .detail-value {
            color: #431407;
            flex: 1;
        }
        .design-preview {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .design-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .design-specs {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .next-steps {
            background: #f0f9ff;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #0ea5e9;
        }
        .next-steps-title {
            color: #0369a1;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .steps-list {
            margin: 0;
            padding-left: 20px;
        }
        .steps-list li {
            margin-bottom: 8px;
            color: #0c4a6e;
        }
        .contact-info {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-top: 25px;
        }
        .contact-title {
            color: #475569;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .footer {
            background: #1e293b;
            color: #cbd5e1;
            padding: 25px;
            text-align: center;
            font-size: 14px;
        }
        .footer a {
            color: #f97316;
            text-decoration: none;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
        }
        .highlight {
            background: linear-gradient(120deg, #fed7aa 0%, #fed7aa 100%);
            background-repeat: no-repeat;
            background-size: 100% 0.3em;
            background-position: 0 88%;
            padding: 2px 4px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">GianConstruct</div>
            <h1>Consultation Request Confirmed</h1>
            <p>Building Your Dream Home Together</p>
        </div>

        <div class="content">
            <div class="section">
                <p>Dear <span class="highlight">${name}</span>,</p>
                <p>Thank you for choosing <strong>GianConstruct</strong> for your dream home project. We're excited to inform you that we have successfully received your consultation request for <span class="highlight">${design.name}</span> and are looking forward to helping you bring your vision to life.</p>
            </div>

            <div class="section">
                <div class="section-title">📅 Your Scheduled Consultation</div>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Appointment Date:</div>
                        <div class="detail-value">${formattedDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Scheduled Time:</div>
                        <div class="detail-value">${preferredTime}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Meeting Format:</div>
                        <div class="detail-value">${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)} Consultation</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🏠 Selected Design Overview</div>
                <div class="design-preview">
                    <div class="design-name">${design.name}</div>
                    <div class="design-specs">
                        ${design.price ? `Price: ₱${design.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} • ` : ""}
                        ${design.square_meters ? `Size: ${design.square_meters} sqm` : ""}
                    </div>
                    <p style="color: #475569; font-size: 14px; margin: 0;">
                        Our team will discuss customization options, budget planning, and project timeline during our consultation.
                    </p>
                </div>
            </div>

            <div class="section">
                <div class="section-title">💬 Your Project Vision</div>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">Contact Email:</div>
                        <div class="detail-value">${email}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Contact Phone:</div>
                        <div class="detail-value">${phone}</div>
                    </div>
                    <div class="detail-item" style="align-items: flex-start;">
                        <div class="detail-label">Project Details:</div>
                        <div class="detail-value">${message}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">📋 What Happens Next</div>
                <div class="next-steps">
                    <div class="next-steps-title">Our Process:</div>
                    <ol class="steps-list">
                        <li><strong>Confirmation Call:</strong> Our team will contact you within 24 hours to confirm your appointment details</li>
                        <li><strong>Pre-Consultation Preparation:</strong> We'll review your project requirements and prepare initial insights</li>
                        <li><strong>In-depth Discussion:</strong> During our meeting, we'll explore design options, budget considerations, and timeline</li>
                        <li><strong>Proposal Development:</strong> We'll create a customized proposal based on our discussion</li>
                        <li><strong>Project Kick-off:</strong> Once approved, we'll begin the exciting journey of building your dream home</li>
                    </ol>
                </div>
            </div>

            <div class="contact-info">
                <div class="contact-title">Need Immediate Assistance?</div>
                <p style="margin: 8px 0; color: #475569;">
                    Email: <a href="mailto:info@gianconstruct.com">info@gianconstruct.com</a><br>
                    Phone: <a href="tel:+6321234567">+63 2 123 4567</a><br>
                    Office Hours: Monday - Friday, 8:00 AM - 5:00 PM
                </p>
            </div>

            <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
                <p><em>We're committed to making your dream home a reality with quality craftsmanship and personalized service.</em></p>
            </div>
        </div>

        <div class="footer">
            <p>&copy; 2024 GianConstruct. All rights reserved.</p>
            <p>
                <a href="https://gianconstruct.com">Visit Our Website</a> |
                <a href="https://gianconstruct.com/privacy">Privacy Policy</a> |
                <a href="https://gianconstruct.com/terms">Terms of Service</a>
            </p>
            <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
                Building Excellence, Creating Homes<br>
                This is an automated message. Please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>
`;

    await sendEmail({
      to: email,
      subject: "Appointment Request Confirmation - GianConstruct",
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
        const design = await DesignModel.findOne({ design_id: n.design.id });
        return {
          _id: n._id.toString(),
          userEmail: n.userEmail,
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

// New action to clear all notifications
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
