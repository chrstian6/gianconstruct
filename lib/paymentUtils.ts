import dbConnect from "@/lib/db";
import Transaction from "@/models/Transactions";
import Project from "@/models/Project";

export interface PaymentSummary {
  total_cost: number;
  total_paid: number;
  total_pending: number;
  remaining_balance: number;
  paid_transactions: any[];
  pending_transactions: any[];
  all_transactions: any[];
}

export async function getProjectPaymentSummary(
  projectId: string
): Promise<PaymentSummary | null> {
  await dbConnect();
  try {
    // Find the project
    const project = await Project.findOne({ project_id: projectId });
    if (!project) {
      console.log("❌ Project not found for payment summary:", projectId);
      return null;
    }

    // Get all transactions for this project
    const transactions = await Transaction.find({ project_id: projectId });

    // Calculate totals
    const paidTransactions = transactions.filter((t) => t.status === "paid");
    const pendingTransactions = transactions.filter(
      (t) => t.status === "pending"
    );

    const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPending = pendingTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const remainingBalance = project.totalCost - totalPaid - totalPending;

    console.log("📊 Payment summary calculated:", {
      projectId,
      totalCost: project.totalCost,
      totalPaid,
      totalPending,
      remainingBalance,
    });

    return {
      total_cost: project.totalCost,
      total_paid: totalPaid,
      total_pending: totalPending,
      remaining_balance: Math.max(0, remainingBalance), // Ensure non-negative
      paid_transactions: paidTransactions,
      pending_transactions: pendingTransactions,
      all_transactions: transactions,
    };
  } catch (error) {
    console.error("❌ Error getting payment summary:", error);
    return null;
  }
}

export async function canAddPartialPayment(
  projectId: string,
  amount: number
): Promise<boolean> {
  const summary = await getProjectPaymentSummary(projectId);
  if (!summary) return false;

  return amount > 0 && amount <= summary.remaining_balance;
}

export async function getProjectRemainingBalance(
  projectId: string
): Promise<number> {
  const summary = await getProjectPaymentSummary(projectId);
  return summary ? summary.remaining_balance : 0;
}

export async function isProjectFullyPaid(projectId: string): Promise<boolean> {
  const summary = await getProjectPaymentSummary(projectId);
  return summary ? summary.remaining_balance <= 0 : false;
}

export async function getTransactionSummary(transactionId: string) {
  await dbConnect();
  try {
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });
    if (!transaction) return null;

    const paymentSummary = await getProjectPaymentSummary(
      transaction.project_id
    );

    return {
      transaction,
      payment_summary: paymentSummary,
    };
  } catch (error) {
    console.error("❌ Error getting transaction summary:", error);
    return null;
  }
}
