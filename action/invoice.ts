"use server";

import {
  notificationService,
  createProjectNotification,
} from "@/lib/notification-services";
import { sendEmail } from "@/lib/nodemailer";
import { generateEmailTemplate } from "@/lib/email-templates";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Transaction, { ITransaction } from "@/models/Transactions";
import Project from "@/models/Project";
import User from "@/models/User";

interface SendInvoiceParams {
  transactionId: string;
  clientEmail: string;
  clientName: string;
  projectId: string;
  projectName: string;
  amount: number;
  dueDate: string;
  type: string;
  description: string;
  isSummary?: boolean; // Add this lin
}

export async function sendInvoiceEmail(params: SendInvoiceParams) {
  try {
    const {
      transactionId,
      clientEmail,
      clientName,
      projectId,
      projectName,
      amount,
      dueDate,
      type,
      description,
    } = params;

    // 1. Send invoice email to client
    const invoiceHtml = generateInvoiceEmail({
      clientName,
      projectName,
      projectId,
      transactionId,
      amount,
      dueDate,
      type,
      description,
    });

    await sendEmail({
      to: clientEmail,
      subject: `Invoice for ${projectName} - ${type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")} Payment`,
      html: invoiceHtml,
    });

    // 2. Create in-app notification for client
    const projectData = {
      project_id: projectId,
      name: projectName,
    };

    const userDetails = {
      email: clientEmail,
      fullName: clientName,
    };

    // Create project notification
    await createProjectNotification(
      projectData,
      userDetails,
      "invoice_sent",
      "Invoice Sent",
      `An invoice for ₱${amount.toLocaleString()} has been sent to your email for ${projectName}. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
      {
        transactionId,
        amount,
        dueDate,
        paymentType: type,
        description,
      }
    );

    // 3. Create admin notification (optional)
    const adminNotification = await notificationService.createNotification({
      userEmail: clientEmail,
      targetUserRoles: ["admin"],
      feature: "invoices",
      type: "invoice_sent", // This is valid in your model
      title: "Invoice Sent to Client",
      message: `Invoice for ${projectName} (₱${amount.toLocaleString()}) sent to ${clientName} (${clientEmail})`,
      channels: ["in_app"],
      metadata: {
        clientName,
        clientEmail,
        projectId,
        projectName,
        amount,
        transactionId,
        dueDate,
      },
      relatedId: transactionId,
    });

    // Revalidate relevant paths
    revalidatePath("/admin/transactions");
    revalidatePath("/user/projects");

    return {
      success: true,
      message: "Invoice sent successfully and client notified",
      notificationId: adminNotification?._id?.toString(),
    };
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return {
      success: false,
      error: "Failed to send invoice",
    };
  }
}

interface InvoiceEmailData {
  clientName: string;
  projectName: string;
  projectId: string;
  transactionId: string;
  amount: number;
  dueDate: string;
  type: string;
  description: string;
}

function generateInvoiceEmail(data: InvoiceEmailData): string {
  const {
    clientName,
    projectName,
    projectId,
    transactionId,
    amount,
    dueDate,
    type,
    description,
  } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const paymentTypeLabels: Record<string, string> = {
    downpayment: "Down Payment",
    partial_payment: "Partial Payment",
    balance: "Balance Payment",
    full: "Full Payment",
  };

  return generateEmailTemplate({
    title: `Invoice - ${projectName}`,
    message: `Dear ${clientName},<br><br>This is your official invoice for <strong>${projectName}</strong>. Please review the payment details below and complete the payment by the due date to avoid any delays in your project timeline.`,
    details: `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Invoice Number</div>
    <div class="detail-value">INV-${transactionId.slice(-8).toUpperCase()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${projectName}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${projectId}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Type</div>
    <div class="detail-value">${paymentTypeLabels[type] || type}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Description</div>
    <div class="detail-value">${description}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount Due</div>
    <div class="detail-value"><strong>${formatCurrency(amount)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Due Date</div>
    <div class="detail-value">${formatDate(dueDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Invoice Date</div>
    <div class="detail-value">${new Date().toLocaleDateString()}</div>
  </div>
</div>
    `,
    nextSteps: `
<strong>Payment Instructions:</strong><br>
1. You can pay directly through our secure payment portal<br>
2. Bank Transfer: BPI Account # 1234-5678-90 (GianConstruct Inc.)<br>
3. GCash: 0908 982 1649 (GianConstruct)<br>
4. Please include the invoice number as payment reference
    `,
    showButton: true,
    buttonText: "Pay Now",
    buttonUrl: `${process.env.NEXTAUTH_URL}/payments/${transactionId}`,
  });
}

// Function to generate payment confirmation email
function generatePaymentConfirmationEmail(data: {
  clientName: string;
  projectName: string;
  transactionId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}): string {
  const {
    clientName,
    projectName,
    transactionId,
    amount,
    paymentDate,
    paymentMethod,
    referenceNumber,
    notes,
  } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return generateEmailTemplate({
    title: `Payment Confirmation - ${projectName}`,
    message: `Dear ${clientName},<br><br>This email confirms that your payment has been successfully processed and recorded. Thank you for your payment!`,
    details: `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Confirmation Number</div>
    <div class="detail-value">PAY-${transactionId.slice(-8).toUpperCase()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${projectName}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Transaction ID</div>
    <div class="detail-value">${transactionId}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount Paid</div>
    <div class="detail-value"><strong>${formatCurrency(amount)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Date</div>
    <div class="detail-value">${formatDate(paymentDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Method</div>
    <div class="detail-value">${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</div>
  </div>
  ${
    referenceNumber
      ? `
  <div class="detail-row">
    <div class="detail-label">Reference Number</div>
    <div class="detail-value">${referenceNumber}</div>
  </div>
  `
      : ""
  }
  ${
    notes
      ? `
  <div class="detail-row">
    <div class="detail-label">Notes</div>
    <div class="detail-value">${notes}</div>
  </div>
  `
      : ""
  }
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span style="color: #10B981; font-weight: bold;">✓ PAID</span></div>
  </div>
</div>
    `,
    nextSteps: `
<strong>Next Steps:</strong><br>
1. Your payment has been recorded in our system<br>
2. You can view all your transactions in your account dashboard<br>
3. Contact our support team if you have any questions about this payment
    `,
    showButton: true,
    buttonText: "View Transaction",
    buttonUrl: `${process.env.NEXTAUTH_URL}/user/transactions`,
  });
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

// Function to mark invoice as paid (to be called when payment is completed)
export async function markInvoiceAsPaid(
  transactionId: string,
  projectId: string
) {
  try {
    await dbConnect();

    // Update transaction status
    const transaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        $set: {
          status: "paid",
          paid_at: new Date(),
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "invoices",
      type: "payment_received", // Changed to valid type
      title: "Payment Received",
      message: `Payment for transaction ${transactionId} has been received and processed.`,
      channels: ["in_app"],
      metadata: {
        transactionId,
        projectId,
        paidAt: new Date().toISOString(),
        amount: transaction.amount,
        type: transaction.type,
      },
      relatedId: transactionId,
    });

    revalidatePath("/admin/transactions");

    return { success: true, data: transaction };
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    return { success: false, error: "Failed to update invoice status" };
  }
}

// Define types for lean documents
type LeanTransaction = {
  transaction_id: string;
  project_id: string;
  user_id: string;
  amount: number;
  total_amount: number;
  type: "downpayment" | "partial_payment" | "balance" | "full";
  status: "pending" | "paid" | "expired" | "cancelled";
  due_date: Date;
  payment_deadline: Date;
  created_at: Date;
  updated_at: Date;
  paid_at?: Date;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
};

type LeanProject = {
  project_id: string;
  name: string;
  userId: string;
  totalCost?: number;
  total_paid?: number;
  payment_progress?: number;
  location?: {
    fullAddress?: string;
    region?: string;
    province?: string;
    municipality?: string;
    barangay?: string;
  };
};

// Update transaction payment with detailed information
export async function updateTransactionPayment({
  transactionId,
  amount,
  paidDate,
  status = "paid",
  notes = "",
  discount = 0,
  paymentMethod = "manual",
  referenceNumber = "",
}: {
  transactionId: string;
  amount: number;
  paidDate: Date;
  status?: "pending" | "paid" | "expired" | "cancelled";
  notes?: string;
  discount?: number;
  paymentMethod?: string;
  referenceNumber?: string;
}) {
  try {
    await dbConnect();

    // Find the transaction
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Validate payment amount
    if (amount > transaction.total_amount) {
      return {
        success: false,
        error: "Payment amount cannot exceed the total transaction amount",
      };
    }

    // Calculate actual paid amount (with discount applied)
    const actualPaidAmount = amount - discount;

    if (actualPaidAmount <= 0) {
      return {
        success: false,
        error: "Payment amount must be greater than zero after discount",
      };
    }

    // Update transaction
    const updateData: any = {
      status: status,
      amount: actualPaidAmount,
      paid_at: paidDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      notes: notes,
      updated_at: new Date(),
    };

    // Add discount tracking if discount applied
    if (discount > 0) {
      updateData.discount_applied = discount;
      updateData.original_amount = transaction.amount;
    }

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedTransaction) {
      return {
        success: false,
        error: "Failed to update transaction",
      };
    }

    // Update project payment progress
    await updateProjectPaymentProgress(updatedTransaction.project_id);

    // Get project details for notifications
    const project = await Project.findOne({
      project_id: updatedTransaction.project_id,
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    // Get user details for email and notifications
    const userDetails = await getUserDetails(updatedTransaction.user_id);

    // ========== SEND EMAIL NOTIFICATION TO CLIENT ==========
    if (userDetails?.email && status === "paid") {
      try {
        const paymentConfirmationHtml = generatePaymentConfirmationEmail({
          clientName: userDetails.fullName,
          projectName: project.name,
          transactionId: updatedTransaction.transaction_id,
          amount: actualPaidAmount,
          paymentDate: paidDate.toISOString(),
          paymentMethod,
          referenceNumber,
          notes,
        });

        await sendEmail({
          to: userDetails.email,
          subject: `Payment Confirmation - ${project.name}`,
          html: paymentConfirmationHtml,
        });

        console.log(
          `✅ Payment confirmation email sent to ${userDetails.email}`
        );
      } catch (emailError) {
        console.error(
          "❌ Error sending payment confirmation email:",
          emailError
        );
        // Don't fail the whole operation if email fails
      }
    }

    // ========== CREATE IN-APP NOTIFICATIONS ==========

    // 1. Create ADMIN notification
    const adminNotification = await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "invoices",
      type: "payment_received",
      title: "Payment Recorded",
      message: `Payment of ₱${actualPaidAmount.toLocaleString()} has been recorded for transaction ${transactionId}.`,
      channels: ["in_app"],
      metadata: {
        transactionId,
        amount: actualPaidAmount,
        originalAmount: transaction.amount,
        discount,
        paidDate: paidDate.toISOString(),
        status,
        paymentMethod,
        referenceNumber,
        notes,
        recordedAt: new Date().toISOString(),
        projectName: project.name,
        clientName: userDetails?.fullName || "Client",
        clientEmail: userDetails?.email || "No email",
        projectId: updatedTransaction.project_id,
      },
      relatedId: transactionId,
    });

    // 2. Create USER notification if user details are available
    if (userDetails) {
      try {
        // Create project data for notification
        const projectData = {
          project_id: updatedTransaction.project_id,
          name: project.name,
        };

        // Create project notification for user
        await createProjectNotification(
          projectData,
          userDetails,
          "payment_received",
          "Payment Recorded",
          `Your payment of ₱${actualPaidAmount.toLocaleString()} has been recorded for project "${project.name}". Transaction ID: ${updatedTransaction.transaction_id}`,
          {
            transactionId: updatedTransaction.transaction_id,
            amount: actualPaidAmount,
            paidDate: paidDate.toISOString(),
            paymentType: updatedTransaction.type,
            paymentMethod,
            referenceNumber,
            notes,
            discount: discount > 0 ? discount : undefined,
          }
        );

        console.log(`✅ User notification created for ${userDetails.email}`);
      } catch (notificationError) {
        console.error(
          "❌ Error creating user notification:",
          notificationError
        );
      }
    }

    // ========== REVALIDATE PATHS ==========
    revalidatePath("/admin/transactions");
    revalidatePath(`/admin/projects/[id]`, "page");
    revalidatePath("/user/projects");
    revalidatePath(`/user/transactions`);

    return {
      success: true,
      message: "Transaction updated successfully",
      data: {
        transactionId: updatedTransaction.transaction_id,
        amount: actualPaidAmount,
        originalAmount: transaction.amount,
        discount,
        paidDate,
        status: updatedTransaction.status,
        notes: updatedTransaction.notes,
        paymentMethod: updatedTransaction.payment_method,
        referenceNumber: updatedTransaction.reference_number,
        notificationId: adminNotification?._id?.toString(),
        emailSent: !!userDetails?.email,
      },
    };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return {
      success: false,
      error: "Failed to update transaction",
    };
  }
}

// Helper function to update project payment progress
async function updateProjectPaymentProgress(projectId: string) {
  try {
    // Get all transactions for this project
    const transactions = await Transaction.find({ project_id: projectId });

    // Calculate total paid amount
    const totalPaid = transactions
      .filter((t) => t.status === "paid")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate total transaction amount
    const totalAmount = transactions.reduce(
      (sum, t) => sum + t.total_amount,
      0
    );

    // Calculate progress percentage
    const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

    // Update project with payment progress
    await Project.findOneAndUpdate(
      { project_id: projectId },
      {
        $set: {
          total_paid: totalPaid,
          payment_progress: Math.round(progress),
          updatedAt: new Date(),
        },
      }
    );

    return { success: true, totalPaid, progress: Math.round(progress) };
  } catch (error) {
    console.error("Error updating project payment progress:", error);
    return { success: false, error: "Failed to update project progress" };
  }
}

// Get transaction details for payment processing
export async function getTransactionForPayment(transactionId: string) {
  try {
    await dbConnect();

    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    }).lean<LeanTransaction>();

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Get project details
    const project = await Project.findOne({
      project_id: transaction.project_id,
    }).lean<LeanProject>();

    // Note: Your Project model doesn't have client_name or user_email fields
    // It has userId which might be the user's ID
    // You might need to fetch user details from a Users collection

    return {
      success: true,
      data: {
        transactionId: transaction.transaction_id,
        amount: transaction.amount,
        total_amount: transaction.total_amount,
        type: transaction.type,
        status: transaction.status,
        dueDate: transaction.due_date,
        projectId: transaction.project_id,
        projectName: project?.name || "Project",
        clientName: "Client", // You need to get this from Users collection
        clientEmail: project?.userId || "No email", // userId might be email or user ID
        notes: transaction.notes,
        paid_at: transaction.paid_at,
        payment_method: transaction.payment_method,
        reference_number: transaction.reference_number,
      },
    };
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return {
      success: false,
      error: "Failed to fetch transaction details",
    };
  }
}

// Batch update multiple transactions
export async function updateMultipleTransactions(
  updates: Array<{
    transactionId: string;
    amount: number;
    paidDate: Date;
    status?: "pending" | "paid" | "expired" | "cancelled";
    notes?: string;
    paymentMethod?: string;
    referenceNumber?: string;
  }>
) {
  try {
    await dbConnect();

    const results = [];
    const projectIds = new Set<string>();

    for (const update of updates) {
      try {
        // Find the transaction
        const transaction = await Transaction.findOne({
          transaction_id: update.transactionId,
        });

        if (!transaction) {
          results.push({
            transactionId: update.transactionId,
            success: false,
            error: "Transaction not found",
          });
          continue;
        }

        // Update transaction
        const updatedTransaction = await Transaction.findOneAndUpdate(
          { transaction_id: update.transactionId },
          {
            $set: {
              status: update.status || "paid",
              amount: update.amount,
              paid_at: update.paidDate,
              payment_method: update.paymentMethod,
              reference_number: update.referenceNumber,
              notes: update.notes,
              updated_at: new Date(),
            },
          },
          { new: true }
        );

        if (updatedTransaction) {
          projectIds.add(updatedTransaction.project_id);
          results.push({
            transactionId: update.transactionId,
            success: true,
            message: "Transaction updated successfully",
            data: updatedTransaction,
          });
        } else {
          results.push({
            transactionId: update.transactionId,
            success: false,
            error: "Failed to update transaction",
          });
        }
      } catch (error) {
        console.error(
          `Error updating transaction ${update.transactionId}:`,
          error
        );
        results.push({
          transactionId: update.transactionId,
          success: false,
          error: "Internal server error",
        });
      }
    }

    // Update payment progress for all affected projects
    for (const projectId of projectIds) {
      await updateProjectPaymentProgress(projectId);
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Create a summary notification - using valid type
    if (successful > 0) {
      await notificationService.createNotification({
        targetUserRoles: ["admin"],
        feature: "invoices",
        type: "general_message", // Using general_message instead of batch_payment_processed
        title: "Batch Payment Processing Complete",
        message: `Successfully updated ${successful} transactions. ${failed} transactions failed.`,
        channels: ["in_app"],
        metadata: {
          successful,
          failed,
          total: updates.length,
          processedAt: new Date().toISOString(),
        },
      });
    }

    // Revalidate paths
    revalidatePath("/admin/transactions");
    revalidatePath("/user/projects");

    return {
      success: successful > 0,
      message: `Updated ${successful} transactions successfully, ${failed} failed.`,
      results,
    };
  } catch (error) {
    console.error("Error updating multiple transactions:", error);
    return {
      success: false,
      error: "Failed to update transactions",
    };
  }
}

// Get all pending transactions for a project
export async function getPendingTransactions(projectId: string) {
  try {
    await dbConnect();

    const transactions = await Transaction.find({
      project_id: projectId,
      status: "pending",
    })
      .sort({ due_date: 1 })
      .lean<LeanTransaction[]>();

    return {
      success: true,
      data: transactions,
      count: transactions.length,
    };
  } catch (error) {
    console.error("Error fetching pending transactions:", error);
    return {
      success: false,
      error: "Failed to fetch pending transactions",
    };
  }
}

// Get transaction statistics for dashboard
export async function getTransactionStats() {
  try {
    await dbConnect();

    const [
      totalTransactions,
      pendingTransactions,
      paidTransactions,
      totalRevenue,
    ] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "pending" }),
      Transaction.countDocuments({ status: "paid" }),
      Transaction.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    return {
      success: true,
      data: {
        totalTransactions,
        pendingTransactions,
        paidTransactions,
        totalRevenue: revenue,
        paymentRate:
          totalTransactions > 0
            ? Math.round((paidTransactions / totalTransactions) * 100)
            : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    return {
      success: false,
      error: "Failed to fetch transaction statistics",
    };
  }
}

// Update payment deadline (extend due date)
export async function extendPaymentDeadline(
  transactionId: string,
  newDeadline: Date,
  reason?: string
) {
  try {
    await dbConnect();

    const transaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        $set: {
          due_date: newDeadline,
          payment_deadline: newDeadline,
          updated_at: new Date(),
          ...(reason && {
            notes: `${reason} - Deadline extended to ${newDeadline.toLocaleDateString()}`,
          }),
        },
      },
      { new: true }
    );

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Create notification - using valid type
    await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "invoices",
      type: "general_message", // Using general_message instead of deadline_extended
      title: "Payment Deadline Extended",
      message: `Payment deadline for transaction ${transactionId} has been extended to ${newDeadline.toLocaleDateString()}.`,
      channels: ["in_app"],
      metadata: {
        transactionId,
        newDeadline: newDeadline.toISOString(),
        reason,
        extendedAt: new Date().toISOString(),
      },
      relatedId: transactionId,
    });

    revalidatePath("/admin/transactions");

    return {
      success: true,
      message: "Payment deadline extended successfully",
      data: transaction,
    };
  } catch (error) {
    console.error("Error extending payment deadline:", error);
    return {
      success: false,
      error: "Failed to extend payment deadline",
    };
  }
}

// Search transactions
export async function searchTransactions(query: string, limit = 10) {
  try {
    await dbConnect();

    const transactions = await Transaction.find({
      $or: [
        { transaction_id: { $regex: query, $options: "i" } },
        { project_id: { $regex: query, $options: "i" } },
        { reference_number: { $regex: query, $options: "i" } },
        { notes: { $regex: query, $options: "i" } },
      ],
    })
      .limit(limit)
      .sort({ created_at: -1 })
      .lean<LeanTransaction[]>();

    return {
      success: true,
      data: transactions,
      count: transactions.length,
    };
  } catch (error) {
    console.error("Error searching transactions:", error);
    return {
      success: false,
      error: "Failed to search transactions",
    };
  }
}

// Get transactions by date range
export async function getTransactionsByDateRange(
  startDate: Date,
  endDate: Date,
  status?: string
) {
  try {
    await dbConnect();

    const filter: any = {
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (status) {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .sort({ created_at: -1 })
      .lean<LeanTransaction[]>();

    return {
      success: true,
      data: transactions,
      count: transactions.length,
    };
  } catch (error) {
    console.error("Error fetching transactions by date range:", error);
    return {
      success: false,
      error: "Failed to fetch transactions",
    };
  }
}

// ============================================================================
// NEW FUNCTION: Record Manual/Additional Payment
// ============================================================================

// In your recordManualPayment function, update the type parameter:

export async function recordManualPayment({
  projectId,
  clientEmail,
  amount,
  paymentDate,
  paymentMethod = "manual",
  referenceNumber = "",
  notes = "",
  type = "partial_payment", // CHANGED default from "additional" to "partial_payment"
  description = "Additional Payment",
  clientName,
  projectName,
}: {
  projectId: string;
  clientEmail: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  type?: "downpayment" | "partial_payment" | "balance" | "full"; // REMOVED "additional" from union type
  description?: string;
  clientName?: string;
  projectName?: string;
}) {
  try {
    await dbConnect();

    // Validate required fields
    if (!projectId || !clientEmail || !amount || !paymentDate) {
      return {
        success: false,
        error:
          "Missing required fields: projectId, clientEmail, amount, and paymentDate are required",
      };
    }

    if (amount <= 0) {
      return {
        success: false,
        error: "Amount must be greater than 0",
      };
    }

    // Get project details
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    // Generate unique transaction ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const transactionId = `TRX-${timestamp}-${random.toUpperCase()}`;

    // Create new manual payment transaction
    const newTransaction = new Transaction({
      transaction_id: transactionId,
      project_id: projectId,
      user_id: clientEmail,
      amount: amount,
      total_amount: amount,
      type: type, // This now only accepts valid enum values
      status: "paid",
      due_date: new Date(paymentDate),
      payment_deadline: new Date(paymentDate),
      paid_at: new Date(paymentDate),
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      notes: notes,
      description: description || `Manual payment for ${project.name}`,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newTransaction.save();

    // Update project payment progress
    const updateResult = await updateProjectPaymentProgress(projectId);

    // Create project data for notification
    const projectData = {
      project_id: projectId,
      name: projectName || project.name,
    };

    const userDetails = {
      email: clientEmail,
      fullName: clientName || "Client",
    };

    // Create project notification using invoice_paid type (as shown in your notification service)
    await createProjectNotification(
      projectData,
      userDetails,
      "payment_received", // Using invoice_paid as the notification type
      "Payment Received",
      `Manual payment of ₱${amount.toLocaleString()} has been recorded for ${project.name}.`,
      {
        transactionId,
        amount,
        paidDate: paymentDate,
        paymentType: type,
        paymentMethod,
        referenceNumber,
        notes,
      }
    );

    // Also create admin notification
    const adminNotification = await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "invoices",
      type: "payment_received", // Using payment_received for admin notification
      title: "Manual Payment Recorded",
      message: `Manual payment of ₱${amount.toLocaleString()} recorded for ${project.name} (${projectId})`,
      channels: ["in_app"],
      metadata: {
        transactionId,
        amount,
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
        projectId,
        projectName: project.name,
        clientEmail,
        clientName: clientName || "Client",
        recordedAt: new Date().toISOString(),
        isManualPayment: true,
        type: type, // Include the transaction type
      },
      relatedId: transactionId,
    });

    // Revalidate paths to refresh UI
    revalidatePath("/admin/transactions");
    revalidatePath(`/admin/projects/[id]`, "page");
    revalidatePath("/user/projects");

    return {
      success: true,
      message: "Manual payment recorded successfully",
      data: {
        transactionId,
        amount,
        paymentDate,
        paymentMethod,
        referenceNumber,
        projectId,
        projectName: project.name,
        clientName: clientName || "Client",
        notificationId: adminNotification?._id?.toString(),
      },
    };
  } catch (error) {
    console.error("Error recording manual payment:", error);
    return {
      success: false,
      error: "Failed to record manual payment. Please try again.",
    };
  }
}

// ============================================================================
// NEW FUNCTION: Record Payment for Existing Transaction (Manual Entry)
// ============================================================================

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
  try {
    await dbConnect();

    // Find the existing transaction
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Validate amount doesn't exceed total
    if (amount > transaction.total_amount) {
      return {
        success: false,
        error: `Amount cannot exceed transaction total of ₱${transaction.total_amount.toLocaleString()}`,
      };
    }

    // Update the transaction with manual payment details
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        $set: {
          status: "paid",
          amount: amount,
          paid_at: new Date(paidDate),
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          notes: notes,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedTransaction) {
      return {
        success: false,
        error: "Failed to update transaction",
      };
    }

    // Update project payment progress
    await updateProjectPaymentProgress(updatedTransaction.project_id);

    // Get project details
    const project = await Project.findOne({
      project_id: updatedTransaction.project_id,
    });

    // Create notification for admin
    const adminNotification = await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "invoices",
      type: "payment_received",
      title: "Transaction Payment Recorded",
      message: `Payment of ₱${amount.toLocaleString()} recorded for transaction ${transactionId}`,
      channels: ["in_app"],
      metadata: {
        transactionId,
        originalAmount: transaction.amount,
        paidAmount: amount,
        paymentDate: paidDate,
        paymentMethod,
        referenceNumber,
        notes,
        projectId: updatedTransaction.project_id,
        projectName: project?.name || "Project",
        recordedAt: new Date().toISOString(),
        isExistingTransaction: true,
      },
      relatedId: transactionId,
    });

    // Revalidate paths
    revalidatePath("/admin/transactions");
    revalidatePath(`/admin/projects/[id]`, "page");

    return {
      success: true,
      message: "Payment recorded successfully for existing transaction",
      data: {
        transactionId,
        amount,
        paidDate,
        paymentMethod,
        referenceNumber,
        projectId: updatedTransaction.project_id,
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
