"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transactions";
import Project from "@/models/Project";
import User from "@/models/User";
import { getProjectPaymentSummary } from "@/lib/paymentUtils";
import { markTransactionAsPaid } from "./transaction";
import {
  notificationService,
  createProjectNotification,
} from "@/lib/notification-services";

export interface ManualPaymentData {
  projectId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  paymentType?: "downpayment" | "partial_payment" | "balance" | "full";
  description?: string;
}

export interface ManualPaymentResponse {
  success: boolean;
  error?: string;
  transaction?: {
    transaction_id: string;
    amount: number;
    type: string;
    payment_deadline: Date;
  };
  payment_summary?: {
    total_cost: number;
    total_paid: number;
    total_pending: number;
    remaining_balance: number;
  };
  notificationId?: string;
}

export async function createManualPayment({
  projectId,
  amount,
  paymentDate,
  paymentMethod = "manual",
  referenceNumber = "",
  notes = "",
  paymentType = "partial_payment",
  description = "Manual Payment",
}: ManualPaymentData): Promise<ManualPaymentResponse> {
  await dbConnect();

  try {
    console.log("💰 Creating manual payment for project:", projectId);
    console.log("💵 Amount:", amount);

    // 1. First, get project details including userId
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // 2. Get user details for notifications
    // FIXED: Use user_id field instead of userId
    const user = await User.findOne({ user_id: project.userId });
    if (!user) {
      return { success: false, error: "User not found for this project" };
    }

    // Extract user details - using correct field names
    const userEmail = user.email || user.user_id || ""; // Use user_id, not userId
    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || "Client";

    console.log("👤 User details:", {
      user_id: user.user_id, // Correct field name
      email: userEmail,
      name: userName,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // 3. Get payment summary to validate amount
    const paymentSummary = await getProjectPaymentSummary(projectId);
    if (!paymentSummary) {
      return { success: false, error: "Failed to calculate payment summary" };
    }

    // 4. Validate the payment amount
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    if (amount > paymentSummary.remaining_balance) {
      return {
        success: false,
        error: `Amount exceeds remaining balance. Maximum: ₱${paymentSummary.remaining_balance.toLocaleString("en-PH")}`,
      };
    }

    // 5. Generate a proper transaction ID using the Transaction model
    const TransactionModel = Transaction as any;
    const transactionId = await TransactionModel.generateTransactionId();

    // 6. Create the manual payment transaction (status: paid immediately)
    const currentDate = new Date(paymentDate);
    const paymentDeadline = new Date(currentDate);
    paymentDeadline.setDate(paymentDeadline.getDate() + 7); // 7 days deadline

    const manualPayment = await TransactionModel.create({
      transaction_id: transactionId,
      project_id: projectId,
      user_id: project.userId, // Use the userId from project
      amount: amount,
      total_amount: project.totalCost,
      type: paymentType,
      status: "paid", // Manual payments are immediately marked as paid
      due_date: currentDate,
      payment_deadline: paymentDeadline,
      paid_at: currentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      notes: notes || description,
      created_at: currentDate,
      updated_at: currentDate,
    });

    // 7. Get updated payment summary
    const updatedSummary = await getProjectPaymentSummary(projectId);

    console.log("✅ Manual payment created:", {
      transaction_id: manualPayment.transaction_id,
      amount: manualPayment.amount,
      type: manualPayment.type,
      user_id: manualPayment.user_id,
    });

    // 8. Create project data for notification
    const projectData = {
      project_id: projectId,
      name: project.name,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      totalCost: project.totalCost,
      location: project.location,
      userId: project.userId,
    };

    const userDetails = {
      email: userEmail,
      fullName: userName,
      firstName: user.firstName,
      lastName: user.lastName,
      user_id: user.user_id, // Add user_id for reference
    };

    // 9. Create notification for client (using payment_received type which is valid)
    console.log("📝 Creating payment notification for client...");
    const clientNotification = await createProjectNotification(
      projectData,
      userDetails,
      "payment_received", // Using valid notification type
      "Payment Received",
      `A manual payment of ₱${amount.toLocaleString()} has been recorded for ${project.name}.`,
      {
        transactionId: manualPayment.transaction_id,
        amount: amount,
        paidDate: currentDate.toISOString(),
        paymentType: paymentType,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber,
        notes: notes,
        isManualPayment: true,
      }
    );

    // 10. Create admin notification
    console.log("📝 Creating admin notification...");
    const adminNotification = await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "invoices", // Using invoices feature for admin notifications
      type: "payment_received", // Valid type for invoices feature
      title: "Manual Payment Recorded",
      message: `Manual payment of ₱${amount.toLocaleString()} recorded for ${project.name} (${projectId}) by admin`,
      channels: ["in_app"],
      metadata: {
        transactionId: manualPayment.transaction_id,
        amount,
        paymentDate: currentDate.toISOString(),
        paymentMethod,
        referenceNumber,
        notes,
        projectId,
        projectName: project.name,
        clientEmail: userEmail,
        clientName: userName,
        clientUserId: project.userId,
        recordedAt: new Date().toISOString(),
        isManualPayment: true,
        type: paymentType,
      },
      relatedId: transactionId,
    });

    console.log("✅ Notifications created:", {
      clientNotificationSuccess: clientNotification,
      adminNotificationId: adminNotification?._id?.toString(),
    });

    // 11. Revalidate paths
    revalidatePath("/admin/transactions");
    revalidatePath(`/admin/projects/[id]`, "page");
    revalidatePath("/user/projects");
    revalidatePath(`/user/projects/${projectId}`);

    // 12. Prepare response
    const responsePaymentSummary = updatedSummary
      ? {
          total_cost: updatedSummary.total_cost,
          total_paid: updatedSummary.total_paid,
          total_pending: updatedSummary.total_pending,
          remaining_balance: updatedSummary.remaining_balance,
        }
      : undefined;

    return {
      success: true,
      transaction: {
        transaction_id: manualPayment.transaction_id,
        amount: manualPayment.amount,
        type: manualPayment.type,
        payment_deadline: manualPayment.payment_deadline,
      },
      payment_summary: responsePaymentSummary,
      notificationId: adminNotification?._id?.toString(),
    };
  } catch (error) {
    console.error("❌ Error creating manual payment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create manual payment",
    };
  }
}

export async function recordExistingTransactionPayment({
  transactionId,
  amount,
  paidDate,
  paymentMethod = "manual",
  referenceNumber = "",
  notes = "",
}: {
  transactionId: string;
  amount: number;
  paidDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
}) {
  await dbConnect();

  try {
    console.log(
      "💰 Recording payment for existing transaction:",
      transactionId
    );

    // 1. Find the existing transaction
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // 2. Validate amount doesn't exceed total
    if (amount > transaction.total_amount) {
      return {
        success: false,
        error: `Amount cannot exceed transaction total of ₱${transaction.total_amount.toLocaleString()}`,
      };
    }

    // 3. Use markTransactionAsPaid from transaction.ts
    const result = await markTransactionAsPaid(
      transactionId,
      paymentMethod,
      referenceNumber
    );

    if (!result.success) {
      return result;
    }

    // 4. Get project and user details for notifications
    const project = await Project.findOne({
      project_id: transaction.project_id,
    });

    if (project) {
      // FIXED: Use user_id field instead of userId
      const user = await User.findOne({ user_id: project.userId });

      if (user) {
        // Extract user details
        const userEmail = user.email || user.user_id || ""; // Use user_id, not userId
        const userName =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.lastName || "Client";

        // 5. Create project data for notification
        const projectData = {
          project_id: project.project_id,
          name: project.name,
          userId: project.userId,
        };

        const userDetails = {
          email: userEmail,
          fullName: userName,
          user_id: user.user_id, // Add user_id
        };

        // 6. Create notification for client
        await createProjectNotification(
          projectData,
          userDetails,
          "payment_received", // Using valid notification type
          "Payment Recorded",
          `Payment of ₱${amount.toLocaleString()} has been recorded for transaction ${transactionId}.`,
          {
            transactionId: transaction.transaction_id,
            originalAmount: transaction.amount,
            paidAmount: amount,
            paidDate: paidDate,
            paymentMethod,
            referenceNumber,
            notes,
            type: transaction.type,
          }
        );
      }
    }

    // 7. Create admin notification
    const adminNotification = await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "invoices",
      type: "payment_received", // Valid type for invoices feature
      title: "Transaction Payment Recorded",
      message: `Payment of ₱${amount.toLocaleString()} recorded for transaction ${transactionId}`,
      channels: ["in_app"],
      metadata: {
        transactionId,
        originalAmount: transaction.amount,
        paidAmount: amount,
        paidDate: paidDate,
        paymentMethod,
        referenceNumber,
        notes,
        projectId: transaction.project_id,
        projectName: project?.name || "Project",
        recordedAt: new Date().toISOString(),
        isExistingTransaction: true,
      },
      relatedId: transactionId,
    });

    return {
      success: true,
      message: "Payment recorded successfully for existing transaction",
      data: {
        transactionId,
        amount,
        paidDate,
        paymentMethod,
        referenceNumber,
        projectId: transaction.project_id,
        projectName: project?.name || "Project",
        notificationId: adminNotification?._id?.toString(),
      },
    };
  } catch (error) {
    console.error("Error recording existing transaction payment:", error);
    return {
      success: false,
      error: "Failed to record payment for existing transaction",
    };
  }
}
