"use server"; // Ensure server-only execution

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Initialize Nodemailer transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer configuration error:", error);
  } else {
    console.log("Nodemailer is ready to send emails via Gmail SMTP");
  }
});

export async function sendEmail({
  to,
  subject,
  html,
}: EmailOptions): Promise<void> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        "SMTP credentials (SMTP_USER or SMTP_PASS) are not defined in .env.local"
      );
    }

    await transporter.sendMail({
      from: `"GianConstruct" <${process.env.SMTP_USER}>`, // e.g., "GianConstruct" <yourname@gmail.com>
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error(
      `Failed to send email: ${error.message || "Unknown error"}`
    );
  }
}
