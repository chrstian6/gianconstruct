"use server";

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
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
      from: `"GianConstruct" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    throw new Error(
      `Failed to send email: ${(error as Error).message || "Unknown error"}`
    );
  }
}
