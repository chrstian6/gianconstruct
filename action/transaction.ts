"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Transaction from "@/models/Transactions";
import Project from "@/models/Project";
import { getProjectPaymentSummary } from "@/lib/paymentUtils";

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

    // Get updated payment summary
    const paymentSummary = await getProjectPaymentSummary(
      updatedTransaction.project_id
    );

    console.log("✅ Transaction marked as paid:", {
      transaction_id: updatedTransaction.transaction_id,
      amount: updatedTransaction.amount,
      project_id: updatedTransaction.project_id,
    });

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
