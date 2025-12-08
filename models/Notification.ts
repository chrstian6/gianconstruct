// models/Notification.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// Simplified role types based on your User model
export type UserRole = "admin" | "user" | "system" | "guest";
export type NotificationType =
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_rescheduled"
  | "appointment_completed"
  | "inquiry_submitted"
  | "project_confirmed"
  | "project_created"
  | "project_updated"
  | "project_completed"
  | "payment_received"
  | "payment_failed"
  | "photo_timeline_update"
  | "document_ready"
  | "milestone_reached"
  | "system_alert"
  | "general_message";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";
export type NotificationChannel = "in_app" | "email" | "push" | "sms";

// Push notification specific interface
export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: number;
  vibrate?: number[];
  sound?: string;
  dir?: "auto" | "ltr" | "rtl";
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

// Base notification interface
export interface BaseNotification {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  isRead?: boolean;
  metadata?: Record<string, any>;
}

// Feature-specific metadata interfaces
export interface AppointmentMetadata {
  inquiryId?: string;
  appointmentId?: string;
  originalDate?: string;
  originalTime?: string;
  reason?: string;
  notes?: string;
  newDate?: string;
  newTime?: string;
  meetingType?: string;
}

export interface ProjectMetadata {
  projectId?: string;
  projectName?: string;
  milestone?: string;
  progress?: number;
  timelineId?: string;
}

export interface PaymentMetadata {
  paymentId?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status?: string;
  invoiceNumber?: string;
}

export interface DocumentMetadata {
  documentId?: string;
  documentType?: string;
  documentName?: string;
  downloadUrl?: string;
  expiryDate?: string;
}

export interface SystemMetadata {
  alertType?: string;
  component?: string;
  severity?: string;
  actionRequired?: boolean;
}

// Main notification document interface
export interface NotificationDocument extends Document, BaseNotification {
  userId?: string;
  userEmail?: string;
  targetUserIds?: string[];
  targetUserRoles?: UserRole[];
  feature:
    | "appointments"
    | "projects"
    | "payments"
    | "documents"
    | "system"
    | "general"
    | "invoices";
  relatedId?: string;

  // Role-based access control
  allowedRoles?: UserRole[]; // Roles that can see this notification
  createdByRole?: UserRole; // Role of the user who created the notification

  // Notification channels
  channels: NotificationChannel[];
  pushData?: PushNotificationData;

  // Feature-specific metadata
  appointmentMetadata?: AppointmentMetadata;
  projectMetadata?: ProjectMetadata;
  paymentMetadata?: PaymentMetadata;
  documentMetadata?: DocumentMetadata;
  systemMetadata?: SystemMetadata;

  // Action
  actionUrl?: string;
  actionLabel?: string;

  // Expiration
  expiresAt?: Date;

  // Delivery status
  emailSent?: boolean;
  pushSent?: boolean;
  smsSent?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: String,
      required: false,
      index: true,
    },
    userEmail: {
      type: String,
      required: false,
      index: true,
    },
    targetUserIds: [
      {
        type: String,
        required: false,
      },
    ],
    targetUserRoles: [
      {
        type: String,
        enum: ["admin", "user"],
        required: false,
      },
    ],
    feature: {
      type: String,
      required: true,
      enum: [
        "appointments",
        "projects",
        "payments",
        "documents",
        "system",
        "general",
        "invoices",
      ],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_rescheduled",
        "appointment_completed",
        "inquiry_submitted",
        "project_created",
        "project_updated",
        "project_completed",
        "project_confirmed",
        "payment_received",
        "payment_failed",
        "document_ready",
        "photo_timeline_update",
        "milestone_reached",
        "system_alert",
        "general_message",
        "invoice_sent",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedId: {
      type: String,
      required: false,
      index: true,
    },

    // Role-based access control
    allowedRoles: [
      {
        type: String,
        enum: ["admin", "user"],
        required: false,
      },
    ],
    createdByRole: {
      type: String,
      enum: ["admin", "user"],
      required: false,
    },

    // Notification channels
    channels: [
      {
        type: String,
        enum: ["in_app", "email", "push", "sms"],
        default: ["in_app"],
      },
    ],

    pushData: {
      title: { type: String },
      body: { type: String },
      icon: { type: String },
      image: { type: String },
      badge: { type: Number },
      sound: { type: String },
      tag: { type: String },
      renotify: { type: Boolean },
      requireInteraction: { type: Boolean },
      actions: [
        {
          action: { type: String },
          title: { type: String },
          icon: { type: String },
        },
      ],
      data: { type: Schema.Types.Mixed },
    },

    // Feature-specific metadata
    appointmentMetadata: {
      inquiryId: { type: String },
      appointmentId: { type: String },
      originalDate: { type: String },
      originalTime: { type: String },
      reason: { type: String },
      notes: { type: String },
      newDate: { type: String },
      newTime: { type: String },
      meetingType: { type: String },
    },
    projectMetadata: {
      projectId: { type: String },
      projectName: { type: String },
      milestone: { type: String },
      progress: { type: Number },
      timelineId: { type: String },
    },
    paymentMetadata: {
      paymentId: { type: String },
      amount: { type: Number },
      currency: { type: String },
      method: { type: String },
      status: { type: String },
      invoiceNumber: { type: String },
    },
    documentMetadata: {
      documentId: { type: String },
      documentType: { type: String },
      documentName: { type: String },
      downloadUrl: { type: String },
      expiryDate: { type: String },
    },
    systemMetadata: {
      alertType: { type: String },
      component: { type: String },
      severity: { type: String },
      actionRequired: { type: Boolean },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      required: false,
    },
    actionLabel: {
      type: String,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: false,
      index: true,
    },

    // Delivery status
    emailSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false },
    smsSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for time ago
NotificationSchema.virtual("timeAgo").get(function () {
  return getTimeAgo(this.createdAt);
});

// Indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userEmail: 1, createdAt: -1 });
NotificationSchema.index({ targetUserIds: 1, createdAt: -1 });
NotificationSchema.index({ targetUserRoles: 1, createdAt: -1 });
NotificationSchema.index({ allowedRoles: 1, createdAt: -1 });
NotificationSchema.index({ feature: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ isRead: 1, createdAt: -1 });
NotificationSchema.index({ priority: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helper function for time ago
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

const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);

export default NotificationModel;
