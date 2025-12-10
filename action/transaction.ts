"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transactions";
import Project from "@/models/Project";
import { getProjectPaymentSummary } from "@/lib/paymentUtils";
import { verifySession } from "@/lib/redis";
import User from "@/models/User";
import { notificationService } from "@/lib/notification-services";

export interface CreatePartialPaymentResponse {
  success: boolean;
  error?: string;
  transaction?: {
    transaction_id: string;
    amount: number;
    type: string;
    payment_deadline: Date;
  };
  remaining_balance?: number;
  payment_summary?: {
    total_cost: number;
    total_paid: number;
    total_pending: number;
    remaining_balance: number;
  };
}

// Helper function to get user details
async function getUserDetails(userId: string) {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      console.warn(`User not found for userId: ${userId}`);
      return null;
    }

    return {
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      fullName:
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Valued Client",
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
}

// Helper function to create transaction notification
async function createTransactionNotification(
  transaction: any,
  project: any,
  userDetails: any,
  notificationType: string,
  title: string,
  message: string,
  additionalMetadata: any = {},
  isAdmin: boolean = false
) {
  try {
    console.log(`📝 Creating ${notificationType} notification...`);

    const baseMetadata = {
      transactionId: transaction.transaction_id,
      amount: transaction.amount,
      totalAmount: transaction.total_amount,
      transactionType: transaction.type,
      status: transaction.status,
      paymentDeadline: transaction.payment_deadline?.toISOString(),
      dueDate: transaction.due_date?.toISOString(),
      projectId: project.project_id,
      projectName: project.name,
      clientName: userDetails?.fullName,
      clientEmail: userDetails?.email,
      remainingBalance: additionalMetadata.remainingBalance || 0,
      paymentMethod: transaction.payment_method,
      referenceNumber: transaction.reference_number,
    };

    // Determine notificationType for routing (admin vs user)
    const notificationRecipientType: "user" | "admin" | undefined = isAdmin
      ? "admin"
      : "user";

    const notificationParams = {
      userId: transaction.user_id,
      userEmail: userDetails?.email,
      targetUserRoles: isAdmin ? ["admin"] : undefined,
      feature: "transactions",
      type: notificationType,
      title,
      message,
      channels: ["in_app", "email"],
      metadata: {
        ...baseMetadata,
        ...additionalMetadata,
      },
      relatedId: transaction.transaction_id,
      actionUrl: isAdmin ? `/admin/transactions` : `/user/transactions`,
      actionLabel: "View Transaction",
      notificationType: notificationRecipientType,
    };

    console.log("📧 Transaction notification params:", {
      feature: notificationParams.feature,
      type: notificationParams.type,
      notificationType: notificationParams.notificationType,
      userEmail: notificationParams.userEmail,
      targetUserRoles: notificationParams.targetUserRoles,
    });

    const notificationResult =
      await notificationService.createNotification(notificationParams);

    if (notificationResult && notificationResult._id) {
      console.log(
        `✅ ${notificationType} notification created:`,
        notificationResult._id
      );
      return true;
    } else {
      console.log(
        `❌ ${notificationType} notification failed - no ID returned`
      );
      return false;
    }
  } catch (notificationError) {
    console.error(
      `❌ Error creating ${notificationType} notification:`,
      notificationError
    );
    return false;
  }
}

export async function createPartialPayment(
  projectId: string,
  amount: number,
  notes?: string
): Promise<CreatePartialPaymentResponse> {
  await dbConnect();
  try {
    console.log("💰 Creating partial payment for project:", projectId);
    console.log("💵 Amount:", amount);

    // Find the project
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      console.log("❌ Project not found:", projectId);
      return { success: false, error: "Project not found" };
    }

    // Get payment summary to calculate remaining balance
    const paymentSummary = await getProjectPaymentSummary(projectId);
    if (!paymentSummary) {
      return { success: false, error: "Failed to calculate payment summary" };
    }

    // Validate the partial payment amount
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    if (amount > paymentSummary.remaining_balance) {
      return {
        success: false,
        error: `Amount exceeds remaining balance. Maximum you can pay: ₱${paymentSummary.remaining_balance.toLocaleString("en-PH")}`,
      };
    }

    // Create partial payment transaction
    const currentDate = new Date();
    const paymentDeadline = new Date(currentDate);
    paymentDeadline.setDate(paymentDeadline.getDate() + 7); // 7 days to pay

    // Use the Transaction model with proper typing
    const TransactionModel = Transaction as any;
    const partialPayment = await TransactionModel.create({
      transaction_id: await TransactionModel.generateTransactionId(),
      project_id: projectId,
      user_id: project.userId,
      amount: amount,
      total_amount: project.totalCost,
      type: "partial_payment",
      status: "pending",
      due_date: currentDate,
      payment_deadline: paymentDeadline,
      notes: notes || `Partial payment for project ${project.name}`,
    });

    // Get updated payment summary
    const updatedSummary = await getProjectPaymentSummary(projectId);

    console.log("✅ Partial payment created:", {
      transaction_id: partialPayment.transaction_id,
      amount: partialPayment.amount,
      new_remaining_balance: updatedSummary?.remaining_balance,
    });

    // Get user details for notification
    const userDetails = await getUserDetails(project.userId);

    // Create notifications for partial payment
    if (userDetails) {
      // 1. Create ADMIN notification
      await createTransactionNotification(
        partialPayment,
        project,
        userDetails,
        "invoice_sent",
        "New Partial Payment Created - Admin",
        `[Admin] A new partial payment of ₱${amount.toLocaleString("en-PH")} has been created for project "${project.name}" by ${userDetails.fullName} (${userDetails.email}). Transaction ID: ${partialPayment.transaction_id}`,
        {
          remainingBalance: updatedSummary?.remaining_balance || 0,
          paymentType: "partial_payment",
          dueDate: paymentDeadline.toISOString(),
        },
        true
      );

      // 2. Create USER notification
      await notificationService.createNotification({
        userId: project.userId,
        userEmail: userDetails.email,
        feature: "transactions",
        type: "invoice_sent",
        title: "Partial Payment Created",
        message: `A partial payment of ₱${amount.toLocaleString("en-PH")} has been created for your project "${project.name}". Please pay within 7 days (by ${paymentDeadline.toLocaleDateString("en-PH")}). Transaction ID: ${partialPayment.transaction_id}`,
        channels: ["in_app", "email"],
        metadata: {
          transactionId: partialPayment.transaction_id,
          amount: partialPayment.amount,
          remainingBalance: updatedSummary?.remaining_balance || 0,
          paymentDeadline: paymentDeadline.toISOString(),
          projectId: project.project_id,
          projectName: project.name,
          clientName: userDetails.fullName,
          clientEmail: userDetails.email,
          paymentType: "partial_payment",
        },
        relatedId: partialPayment.transaction_id,
        actionUrl: `/user/transactions`,
        actionLabel: "View Payment Details",
        notificationType: "user",
      });
    }

    revalidatePath("/user/projects");
    revalidatePath("/admin/transactions");
    revalidatePath(`/user/projects/${projectId}`);
    revalidatePath(`/admin/admin-project?project=${projectId}`);

    // Create the payment summary object for response (not including transactions array)
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
        transaction_id: partialPayment.transaction_id,
        amount: partialPayment.amount,
        type: partialPayment.type,
        payment_deadline: partialPayment.payment_deadline,
      },
      remaining_balance: updatedSummary?.remaining_balance,
      payment_summary: responsePaymentSummary,
    };
  } catch (error) {
    console.error("❌ Error creating partial payment:", error);
    return { success: false, error: "Failed to create partial payment" };
  }
}

export async function markTransactionAsPaid(
  transactionId: string,
  paymentMethod: string = "cash",
  referenceNumber?: string
): Promise<{
  success: boolean;
  error?: string;
  transaction?: any;
  payment_summary?: {
    total_cost: number;
    total_paid: number;
    total_pending: number;
    remaining_balance: number;
  };
}> {
  await dbConnect();
  try {
    console.log("💰 Marking transaction as paid:", transactionId);

    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });
    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (transaction.status === "paid") {
      return { success: false, error: "Transaction is already paid" };
    }

    const currentDate = new Date();

    // Update transaction status
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        status: "paid",
        paid_at: currentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        updated_at: currentDate,
      },
      { new: true }
    );

    if (!updatedTransaction) {
      return { success: false, error: "Failed to update transaction" };
    }

    // Get the project details
    const project = await Project.findOne({
      project_id: updatedTransaction.project_id,
    });

    if (!project) {
      return { success: false, error: "Project not found for transaction" };
    }

    // Get updated payment summary
    const paymentSummary = await getProjectPaymentSummary(
      updatedTransaction.project_id
    );

    console.log("✅ Transaction marked as paid:", {
      transaction_id: updatedTransaction.transaction_id,
      amount: updatedTransaction.amount,
      project_id: updatedTransaction.project_id,
    });

    // Get user details for notification
    const userDetails = await getUserDetails(updatedTransaction.user_id);

    // Create notifications for payment received
    if (userDetails) {
      // 1. Create ADMIN notification
      await createTransactionNotification(
        updatedTransaction,
        project,
        userDetails,
        "payment_received",
        "Payment Received - Admin",
        `[Admin] Payment of ₱${updatedTransaction.amount.toLocaleString("en-PH")} has been received for project "${project.name}". Transaction ID: ${updatedTransaction.transaction_id}, Payment Method: ${paymentMethod}`,
        {
          remainingBalance: paymentSummary?.remaining_balance || 0,
          paymentMethod: paymentMethod,
          referenceNumber: referenceNumber,
          paidAt: currentDate.toISOString(),
        },
        true
      );

      // 2. Create USER notification
      await notificationService.createNotification({
        userId: updatedTransaction.user_id,
        userEmail: userDetails.email,
        feature: "transactions",
        type: "payment_received",
        title: "Payment Confirmed",
        message: `Your payment of ₱${updatedTransaction.amount.toLocaleString("en-PH")} for project "${project.name}" has been confirmed. Thank you for your payment! Transaction ID: ${updatedTransaction.transaction_id}`,
        channels: ["in_app", "email"],
        metadata: {
          transactionId: updatedTransaction.transaction_id,
          amount: updatedTransaction.amount,
          remainingBalance: paymentSummary?.remaining_balance || 0,
          paymentMethod: paymentMethod,
          referenceNumber: referenceNumber,
          paidAt: currentDate.toISOString(),
          projectId: project.project_id,
          projectName: project.name,
          clientName: userDetails.fullName,
          clientEmail: userDetails.email,
        },
        relatedId: updatedTransaction.transaction_id,
        actionUrl: `/user/transactions`,
        actionLabel: "View Transaction",
        notificationType: "user",
      });
    }

    revalidatePath("/user/projects");
    revalidatePath("/admin/transactions");
    revalidatePath(`/user/projects/${updatedTransaction.project_id}`);
    revalidatePath(
      `/admin/admin-project?project=${updatedTransaction.project_id}`
    );

    // Create the payment summary object for response
    const responsePaymentSummary = paymentSummary
      ? {
          total_cost: paymentSummary.total_cost,
          total_paid: paymentSummary.total_paid,
          total_pending: paymentSummary.total_pending,
          remaining_balance: paymentSummary.remaining_balance,
        }
      : undefined;

    return {
      success: true,
      transaction: updatedTransaction,
      payment_summary: responsePaymentSummary,
    };
  } catch (error) {
    console.error("❌ Error marking transaction as paid:", error);
    return { success: false, error: "Failed to mark transaction as paid" };
  }
}

export async function getProjectTransactions(projectId: string): Promise<{
  success: boolean;
  transactions?: any[];
  error?: string;
}> {
  await dbConnect();
  try {
    const transactions = await Transaction.find({ project_id: projectId }).sort(
      { created_at: 1 }
    );

    return {
      success: true,
      transactions: transactions,
    };
  } catch (error) {
    console.error("❌ Error getting project transactions:", error);
    return { success: false, error: "Failed to get transactions" };
  }
}

export async function getTransactionById(transactionId: string): Promise<{
  success: boolean;
  transaction?: any;
  error?: string;
}> {
  await dbConnect();
  try {
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    return {
      success: true,
      transaction: transaction,
    };
  } catch (error) {
    console.error("❌ Error getting transaction:", error);
    return { success: false, error: "Failed to get transaction" };
  }
}

// ========== NEW FUNCTIONS FOR USER TRANSACTION COMPONENT ==========

// Get all transactions for the logged-in user
export async function getUserTransactions(): Promise<{
  success: boolean;
  transactions?: any[];
  error?: string;
}> {
  await dbConnect();
  try {
    // Get current user from session
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    // Try to get user ID from session (check multiple possible fields)
    const userId = session.user_id || session.userId;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    console.log("🔍 Fetching transactions for user:", userId);

    // Get all transactions for this user
    const transactions = await Transaction.find({ user_id: userId })
      .sort({ created_at: -1 }) // Most recent first
      .lean();

    console.log(
      `✅ Found ${transactions.length} transactions for user ${userId}`
    );

    return {
      success: true,
      transactions: transactions,
    };
  } catch (error) {
    console.error("❌ Error getting user transactions:", error);
    return { success: false, error: "Failed to get transactions" };
  }
}

// Get user transactions with project details
export async function getUserTransactionsWithDetails(): Promise<{
  success: boolean;
  transactions?: any[];
  error?: string;
}> {
  await dbConnect();
  try {
    // Get current user from session
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    console.log("🔍 Fetching transactions with details for user:", userId);

    // Get transactions
    const transactions = await Transaction.find({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();

    // Get project details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction: any) => {
        const project = await Project.findOne({
          project_id: transaction.project_id,
        }).lean();

        // Convert MongoDB ObjectId to string and create plain object
        const plainTransaction = {
          _id: transaction._id?.toString() || transaction._id || "",
          transaction_id: transaction.transaction_id || "",
          project_id: transaction.project_id || "",
          user_id: transaction.user_id || "",
          amount: Number(transaction.amount) || 0,
          total_amount: Number(transaction.total_amount) || 0,
          type: transaction.type || "unknown",
          status: transaction.status || "pending",
          due_date:
            transaction.due_date?.toISOString() || new Date().toISOString(),
          payment_deadline:
            transaction.payment_deadline?.toISOString() ||
            new Date().toISOString(),
          paid_at: transaction.paid_at?.toISOString(),
          payment_method: transaction.payment_method,
          reference_number: transaction.reference_number,
          notes: transaction.notes,
          created_at:
            transaction.created_at?.toISOString() || new Date().toISOString(),
          updated_at:
            transaction.updated_at?.toISOString() || new Date().toISOString(),
          __v: transaction.__v || 0,
        };

        // Add project details if found
        if (project) {
          (plainTransaction as any).project = {
            name: (project as any).name || "Unknown Project",
            status: (project as any).status || "unknown",
            totalCost: (project as any).totalCost || 0,
          };
        }

        return plainTransaction;
      })
    );

    console.log(
      `✅ Found ${transactionsWithDetails.length} transactions with details`
    );

    return {
      success: true,
      transactions: transactionsWithDetails,
    };
  } catch (error) {
    console.error("❌ Error getting user transactions with details:", error);
    return { success: false, error: "Failed to get transactions" };
  }
}

// Get transaction statistics for the logged-in user
export async function getUserTransactionStats(): Promise<{
  success: boolean;
  stats?: {
    totalTransactions: number;
    totalPaid: number;
    totalPending: number;
    totalAmount: number;
    totalPaidAmount: number;
    totalPendingAmount: number;
  };
  error?: string;
}> {
  await dbConnect();
  try {
    // Get current user from session
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    console.log("📊 Getting transaction stats for user:", userId);

    // Get all transactions for this user
    const transactions = await Transaction.find({ user_id: userId }).lean();

    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      totalPaid: transactions.filter((t) => t.status === "paid").length,
      totalPending: transactions.filter((t) => t.status === "pending").length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      totalPaidAmount: transactions
        .filter((t) => t.status === "paid")
        .reduce((sum, t) => sum + t.amount, 0),
      totalPendingAmount: transactions
        .filter((t) => t.status === "pending")
        .reduce((sum, t) => sum + t.amount, 0),
    };

    console.log("✅ Transaction stats:", stats);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("❌ Error getting transaction stats:", error);
    return { success: false, error: "Failed to get transaction statistics" };
  }
}

// Get transactions by status for the logged-in user
export async function getUserTransactionsByStatus(status: string): Promise<{
  success: boolean;
  transactions?: any[];
  error?: string;
}> {
  await dbConnect();
  try {
    // Get current user from session
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    console.log(`🔍 Fetching ${status} transactions for user:`, userId);

    // Get transactions by status
    const transactions = await Transaction.find({
      user_id: userId,
      status: status,
    })
      .sort({ created_at: -1 })
      .lean();

    console.log(`✅ Found ${transactions.length} ${status} transactions`);

    return {
      success: true,
      transactions: transactions,
    };
  } catch (error) {
    console.error("❌ Error getting transactions by status:", error);
    return { success: false, error: "Failed to get transactions" };
  }
}

// Get user transactions with pagination
export async function getUserTransactionsPaginated(params: {
  page: number;
  limit: number;
  status?: string;
  type?: string;
  search?: string;
}): Promise<{
  success: boolean;
  transactions?: any[];
  total?: number;
  totalPages?: number;
  currentPage?: number;
  error?: string;
}> {
  await dbConnect();
  try {
    // Get current user from session
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    const { page = 1, limit = 10, status, type, search } = params;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = { user_id: userId };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { transaction_id: { $regex: search, $options: "i" } },
        { project_id: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get paginated transactions
    const transactions = await Transaction.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get project details for each transaction
    const transactionsWithDetails = await Promise.all(
      transactions.map(async (transaction: any) => {
        const project = await Project.findOne({
          project_id: transaction.project_id,
        }).lean();

        // Type assertion for project
        const projectDoc = project as any;

        return {
          ...transaction,
          project: project
            ? {
                name: projectDoc?.name || "Unknown Project",
                status: projectDoc?.status || "unknown",
                totalCost: projectDoc?.totalCost || 0,
              }
            : null,
        };
      })
    );

    return {
      success: true,
      transactions: transactionsWithDetails,
      total,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("❌ Error getting paginated transactions:", error);
    return { success: false, error: "Failed to get transactions" };
  }
}

// Update transaction (for user to add payment details)
export async function updateTransactionPaymentDetails(
  transactionId: string,
  paymentMethod: string,
  referenceNumber?: string,
  notes?: string
): Promise<{
  success: boolean;
  error?: string;
  transaction?: any;
}> {
  await dbConnect();
  try {
    console.log("🔄 Updating payment details for transaction:", transactionId);

    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Verify user owns this transaction
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (transaction.user_id !== userId) {
      return {
        success: false,
        error: "Unauthorized to update this transaction",
      };
    }

    // Update transaction
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes: notes
          ? `${transaction.notes || ""}\n${notes}`.trim()
          : transaction.notes,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedTransaction) {
      return { success: false, error: "Failed to update transaction" };
    }

    console.log("✅ Transaction payment details updated:", transactionId);

    // Get project and user details for notification
    const project = await Project.findOne({
      project_id: updatedTransaction.project_id,
    });

    if (project) {
      const userDetails = await getUserDetails(updatedTransaction.user_id);

      if (userDetails) {
        // Create ADMIN notification
        await createTransactionNotification(
          updatedTransaction,
          project,
          userDetails,
          "payment_details_updated",
          "Payment Details Updated - Admin",
          `[Admin] Client ${userDetails.fullName} has updated payment details for transaction ${updatedTransaction.transaction_id}. Payment Method: ${paymentMethod}, Reference: ${referenceNumber || "N/A"}`,
          {
            paymentMethod: paymentMethod,
            referenceNumber: referenceNumber,
            updatedAt: new Date().toISOString(),
          },
          true
        );

        // Create USER notification
        await notificationService.createNotification({
          userId: updatedTransaction.user_id,
          userEmail: userDetails.email,
          feature: "transactions",
          type: "payment_details_updated",
          title: "Payment Details Updated",
          message: `Your payment details for transaction ${updatedTransaction.transaction_id} have been updated. Payment Method: ${paymentMethod}, Reference: ${referenceNumber || "N/A"}`,
          channels: ["in_app", "email"],
          metadata: {
            transactionId: updatedTransaction.transaction_id,
            amount: updatedTransaction.amount,
            paymentMethod: paymentMethod,
            referenceNumber: referenceNumber,
            projectId: project.project_id,
            projectName: project.name,
            clientName: userDetails.fullName,
            clientEmail: userDetails.email,
          },
          relatedId: updatedTransaction.transaction_id,
          actionUrl: `/user/transactions`,
          actionLabel: "View Transaction",
          notificationType: "user",
        });
      }
    }

    revalidatePath("/user/transactions");
    revalidatePath(`/user/projects/${updatedTransaction.project_id}`);

    return {
      success: true,
      transaction: updatedTransaction,
    };
  } catch (error) {
    console.error("❌ Error updating transaction payment details:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}

// Cancel a transaction (only if pending)
export async function cancelUserTransaction(
  transactionId: string,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
  transaction?: any;
}> {
  await dbConnect();
  try {
    console.log("❌ Cancelling transaction:", transactionId);

    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Verify user owns this transaction
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (transaction.user_id !== userId) {
      return {
        success: false,
        error: "Unauthorized to cancel this transaction",
      };
    }

    // Only pending transactions can be cancelled
    if (transaction.status !== "pending") {
      return {
        success: false,
        error: `Cannot cancel transaction. Current status: ${transaction.status}`,
      };
    }

    // Update transaction status to cancelled
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        status: "cancelled",
        notes: reason
          ? `${transaction.notes || ""}\nCancelled by user: ${reason}`.trim()
          : `${transaction.notes || ""}\nCancelled by user`.trim(),
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedTransaction) {
      return { success: false, error: "Failed to cancel transaction" };
    }

    console.log("✅ Transaction cancelled:", transactionId);

    // Get project and user details for notification
    const project = await Project.findOne({
      project_id: updatedTransaction.project_id,
    });

    if (project) {
      const userDetails = await getUserDetails(updatedTransaction.user_id);

      if (userDetails) {
        // Create ADMIN notification
        await createTransactionNotification(
          updatedTransaction,
          project,
          userDetails,
          "transaction_cancelled",
          "Transaction Cancelled - Admin",
          `[Admin] Transaction ${updatedTransaction.transaction_id} has been cancelled by ${userDetails.fullName}. Reason: ${reason || "No reason provided"}`,
          {
            reason: reason || "No reason provided",
            cancelledAt: new Date().toISOString(),
          },
          true
        );

        // Create USER notification
        await notificationService.createNotification({
          userId: updatedTransaction.user_id,
          userEmail: userDetails.email,
          feature: "transactions",
          type: "transaction_cancelled",
          title: "Transaction Cancelled",
          message: `Your transaction ${updatedTransaction.transaction_id} has been cancelled. Reason: ${reason || "No reason provided"}`,
          channels: ["in_app", "email"],
          metadata: {
            transactionId: updatedTransaction.transaction_id,
            amount: updatedTransaction.amount,
            reason: reason || "No reason provided",
            cancelledAt: new Date().toISOString(),
            projectId: project.project_id,
            projectName: project.name,
            clientName: userDetails.fullName,
            clientEmail: userDetails.email,
          },
          relatedId: updatedTransaction.transaction_id,
          actionUrl: `/user/transactions`,
          actionLabel: "View Transaction",
          notificationType: "user",
        });
      }
    }

    revalidatePath("/user/transactions");
    revalidatePath(`/user/projects/${updatedTransaction.project_id}`);
    revalidatePath("/admin/transactions");

    return {
      success: true,
      transaction: updatedTransaction,
    };
  } catch (error) {
    console.error("❌ Error cancelling transaction:", error);
    return { success: false, error: "Failed to cancel transaction" };
  }
}

// Get overdue transactions for the logged-in user
export async function getOverdueTransactions(): Promise<{
  success: boolean;
  transactions?: any[];
  error?: string;
}> {
  await dbConnect();
  try {
    // Get current user from session
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    const currentDate = new Date();

    // Get overdue pending transactions
    const transactions = await Transaction.find({
      user_id: userId,
      status: "pending",
      payment_deadline: { $lt: currentDate },
    })
      .sort({ payment_deadline: 1 }) // Most overdue first
      .lean();

    console.log(
      `✅ Found ${transactions.length} overdue transactions for user ${userId}`
    );

    return {
      success: true,
      transactions: transactions,
    };
  } catch (error) {
    console.error("❌ Error getting overdue transactions:", error);
    return { success: false, error: "Failed to get overdue transactions" };
  }
}

// Get upcoming due transactions (within next 7 days)
export async function getUpcomingDueTransactions(): Promise<{
  success: boolean;
  transactions?: any[];
  error?: string;
}> {
  await dbConnect();
  try {
    // Get current user from session
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = session.user_id || session.userId;
    if (!userId) {
      return { success: false, error: "User ID not found in session" };
    }

    const currentDate = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Get upcoming due transactions
    const transactions = await Transaction.find({
      user_id: userId,
      status: "pending",
      payment_deadline: {
        $gte: currentDate,
        $lte: sevenDaysFromNow,
      },
    })
      .sort({ payment_deadline: 1 }) // Soonest first
      .lean();

    console.log(
      `✅ Found ${transactions.length} upcoming due transactions for user ${userId}`
    );

    return {
      success: true,
      transactions: transactions,
    };
  } catch (error) {
    console.error("❌ Error getting upcoming due transactions:", error);
    return { success: false, error: "Failed to get upcoming due transactions" };
  }
}

// NEW: Create a payment reminder notification
export async function createPaymentReminder(transactionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await dbConnect();
  try {
    console.log("🔔 Creating payment reminder for transaction:", transactionId);

    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Only send reminders for pending transactions
    if (transaction.status !== "pending") {
      return {
        success: false,
        error: "Cannot send reminder for non-pending transaction",
      };
    }

    // Get project details
    const project = await Project.findOne({
      project_id: transaction.project_id,
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Get user details
    const userDetails = await getUserDetails(transaction.user_id);

    if (!userDetails) {
      return { success: false, error: "User details not found" };
    }

    // Calculate days until deadline
    const currentDate = new Date();
    const deadline = new Date(transaction.payment_deadline);
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let reminderType = "";
    let title = "";
    let message = "";

    if (daysUntilDeadline <= 0) {
      reminderType = "payment_overdue";
      title = "Payment Overdue";
      message = `Your payment of ₱${transaction.amount.toLocaleString("en-PH")} for project "${project.name}" is overdue. Please make the payment immediately to avoid delays.`;
    } else if (daysUntilDeadline <= 2) {
      reminderType = "payment_reminder_urgent";
      title = "Payment Due Soon";
      message = `Friendly reminder: Your payment of ₱${transaction.amount.toLocaleString("en-PH")} for project "${project.name}" is due in ${daysUntilDeadline} day(s).`;
    } else {
      reminderType = "payment_reminder";
      title = "Payment Reminder";
      message = `Reminder: Your payment of ₱${transaction.amount.toLocaleString("en-PH")} for project "${project.name}" is due on ${deadline.toLocaleDateString("en-PH")}.`;
    }

    // Create USER reminder notification
    await notificationService.createNotification({
      userId: transaction.user_id,
      userEmail: userDetails.email,
      feature: "transactions",
      type: reminderType,
      title,
      message,
      channels: ["in_app", "email"],
      metadata: {
        transactionId: transaction.transaction_id,
        amount: transaction.amount,
        dueDate: transaction.payment_deadline?.toISOString(),
        daysUntilDeadline: daysUntilDeadline,
        projectId: project.project_id,
        projectName: project.name,
        clientName: userDetails.fullName,
        clientEmail: userDetails.email,
      },
      relatedId: transaction.transaction_id,
      actionUrl: `/user/transactions`,
      actionLabel: "View Payment",
      notificationType: "user",
    });

    console.log(`✅ Payment reminder sent for transaction: ${transactionId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("❌ Error creating payment reminder:", error);
    return { success: false, error: "Failed to create payment reminder" };
  }
}

// NEW: Get transaction notification statistics
export async function getTransactionNotificationStats(userId: string): Promise<{
  success: boolean;
  stats?: {
    pendingReminders: number;
    overdueReminders: number;
    recentPayments: number;
    totalNotifications: number;
  };
  error?: string;
}> {
  await dbConnect();
  try {
    console.log("📊 Getting transaction notification stats for user:", userId);

    // Get all transactions for this user
    const transactions = await Transaction.find({ user_id: userId }).lean();

    const currentDate = new Date();

    // Calculate statistics
    const pendingTransactions = transactions.filter(
      (t) => t.status === "pending"
    );

    const overdueTransactions = pendingTransactions.filter((t) => {
      if (!t.payment_deadline) return false;
      return new Date(t.payment_deadline) < currentDate;
    });

    const recentPaidTransactions = transactions
      .filter((t) => t.status === "paid")
      .filter((t) => {
        if (!t.paid_at) return false;
        const paidDate = new Date(t.paid_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return paidDate >= thirtyDaysAgo;
      });

    const stats = {
      pendingReminders: pendingTransactions.length,
      overdueReminders: overdueTransactions.length,
      recentPayments: recentPaidTransactions.length,
      totalNotifications:
        pendingTransactions.length + recentPaidTransactions.length,
    };

    console.log("✅ Transaction notification stats:", stats);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("❌ Error getting transaction notification stats:", error);
    return {
      success: false,
      error: "Failed to get transaction notification statistics",
    };
  }
}
