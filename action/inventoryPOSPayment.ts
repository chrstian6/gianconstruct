// actions/inventoryPOSPayment.ts
"use server";
import dbConnect from "@/lib/db";
import InventoryTransaction from "@/models/InventoryTransactions";
import { InventoryPOSPayment } from "@/types/inventory-pos";

export async function createInventoryPOSPayment(
  paymentData: InventoryPOSPayment
) {
  try {
    await dbConnect();

    // Extract client info
    const clientInfo = paymentData.clientInfo;

    const transaction = await InventoryTransaction.create({
      transaction_id: paymentData.id,
      referenceNumber: paymentData.referenceNumber,
      clientName: clientInfo.clientName,
      clientEmail: clientInfo.clientEmail,
      clientPhone: clientInfo.clientPhone,
      clientAddress: clientInfo.clientAddress,
      items: paymentData.items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        category: item.category,
      })),
      paymentMethod: paymentData.paymentMethod,
      paymentType: paymentData.paymentType,
      subtotal: paymentData.subtotal,
      discountAmount: paymentData.discountAmount || 0,
      discountPercentage: paymentData.discountPercentage || 0,
      taxAmount: paymentData.taxAmount || 0,
      taxPercentage: paymentData.taxPercentage || 0,
      totalAmount: paymentData.totalAmount,
      amountPaid: paymentData.amountPaid,
      change: paymentData.change,
      transactionDate: new Date(paymentData.transactionDate),
      notes: paymentData.notes,
      status: paymentData.status || "completed",
    });

    return {
      success: true,
      payment: {
        id: transaction.transaction_id,
        referenceNumber: transaction.referenceNumber,
        transactionDate: transaction.transactionDate.toISOString(),
        clientName: transaction.clientName,
        totalAmount: transaction.totalAmount,
        itemsCount: transaction.items.length,
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error creating inventory POS payment:", error);
    return {
      success: false,
      error: error.message || "Failed to create inventory POS payment",
    };
  }
}

export async function getInventoryPOSTransactions(
  limit: number = 50,
  skip: number = 0
) {
  try {
    await dbConnect();

    const transactions = await InventoryTransaction.find()
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await InventoryTransaction.countDocuments();

    return {
      success: true,
      transactions: transactions.map((txn: any) => ({
        id: txn.transaction_id,
        referenceNumber: txn.referenceNumber,
        clientName: txn.clientName,
        clientEmail: txn.clientEmail,
        clientPhone: txn.clientPhone,
        totalAmount: txn.totalAmount,
        itemsCount: txn.items.length,
        paymentMethod: txn.paymentMethod,
        paymentType: txn.paymentType,
        status: txn.status,
        transactionDate: txn.transactionDate.toISOString(),
        createdAt: txn.createdAt.toISOString(),
      })),
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("Error fetching inventory POS transactions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transactions",
      transactions: [],
      total: 0,
    };
  }
}

export async function getInventoryPOSTransactionById(transactionId: string) {
  try {
    await dbConnect();

    const transaction = await InventoryTransaction.findOne({
      transaction_id: transactionId,
    })
      .lean()
      .exec();

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
        transaction: null,
      };
    }

    return {
      success: true,
      transaction: {
        id: transaction.transaction_id,
        referenceNumber: transaction.referenceNumber,
        clientInfo: {
          clientName: transaction.clientName,
          clientEmail: transaction.clientEmail,
          clientPhone: transaction.clientPhone,
          clientAddress: transaction.clientAddress,
        },
        items: transaction.items,
        paymentMethod: transaction.paymentMethod,
        paymentType: transaction.paymentType,
        subtotal: transaction.subtotal,
        discountAmount: transaction.discountAmount,
        discountPercentage: transaction.discountPercentage,
        taxAmount: transaction.taxAmount,
        taxPercentage: transaction.taxPercentage,
        totalAmount: transaction.totalAmount,
        amountPaid: transaction.amountPaid,
        change: transaction.change,
        status: transaction.status,
        transactionDate: transaction.transactionDate.toISOString(),
        notes: transaction.notes,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transaction",
      transaction: null,
    };
  }
}

export async function getInventoryPOSTransactionsByClient(
  clientName: string,
  limit: number = 20
) {
  try {
    await dbConnect();

    const transactions = await InventoryTransaction.find({
      clientName: { $regex: clientName, $options: "i" },
    })
      .sort({ transactionDate: -1 })
      .limit(limit)
      .lean()
      .exec();

    return {
      success: true,
      transactions: transactions.map((txn: any) => ({
        id: txn.transaction_id,
        referenceNumber: txn.referenceNumber,
        clientName: txn.clientName,
        totalAmount: txn.totalAmount,
        itemsCount: txn.items.length,
        paymentMethod: txn.paymentMethod,
        status: txn.status,
        transactionDate: txn.transactionDate.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching client transactions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch client transactions",
      transactions: [],
    };
  }
}

export async function getInventoryPOSTransactionsByDateRange(
  startDate: string,
  endDate: string
) {
  try {
    await dbConnect();

    const transactions = await InventoryTransaction.find({
      transactionDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .sort({ transactionDate: -1 })
      .lean()
      .exec();

    return {
      success: true,
      transactions: transactions.map((txn: any) => ({
        id: txn.transaction_id,
        referenceNumber: txn.referenceNumber,
        clientName: txn.clientName,
        totalAmount: txn.totalAmount,
        paymentMethod: txn.paymentMethod,
        status: txn.status,
        transactionDate: txn.transactionDate.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching transactions by date range:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transactions",
      transactions: [],
    };
  }
}

export async function getInventoryPOSRevenue(
  startDate?: string,
  endDate?: string
) {
  try {
    await dbConnect();

    const query: any = { status: "completed" };

    if (startDate && endDate) {
      query.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const revenue = await InventoryTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalSubtotal: { $sum: "$subtotal" },
          totalTransactions: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: "$items.quantity" } },
          totalDiscount: { $sum: "$discountAmount" },
          totalTax: { $sum: "$taxAmount" },
          averageTransactionValue: { $avg: "$totalAmount" },
          averageDiscount: { $avg: "$discountPercentage" },
        },
      },
    ]);

    return {
      success: true,
      revenue: revenue[0] || {
        totalRevenue: 0,
        totalSubtotal: 0,
        totalTransactions: 0,
        totalItemsSold: 0,
        totalDiscount: 0,
        totalTax: 0,
        averageTransactionValue: 0,
        averageDiscount: 0,
      },
    };
  } catch (error: any) {
    console.error("Error fetching revenue:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch revenue",
      revenue: null,
    };
  }
}

export async function getPaymentMethodStats(
  startDate?: string,
  endDate?: string
) {
  try {
    await dbConnect();

    const query: any = { status: "completed" };

    if (startDate && endDate) {
      query.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const stats = await InventoryTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    return {
      success: true,
      stats,
    };
  } catch (error: any) {
    console.error("Error fetching payment method stats:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch payment method stats",
      stats: [],
    };
  }
}

export async function getProductSalesReport(limit: number = 20) {
  try {
    await dbConnect();

    const sales = await InventoryTransaction.aggregate([
      { $match: { status: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          productName: { $first: "$items.name" },
          productCategory: { $first: "$items.category" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          unitPrice: { $first: "$items.unitPrice" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
    ]);

    return {
      success: true,
      sales,
    };
  } catch (error: any) {
    console.error("Error fetching product sales report:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch product sales report",
      sales: [],
    };
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: "completed" | "pending" | "failed"
) {
  try {
    await dbConnect();

    const transaction = await InventoryTransaction.findOneAndUpdate(
      { transaction_id: transactionId },
      { status },
      { new: true }
    );

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    return {
      success: true,
      message: "Transaction status updated successfully",
      transaction: {
        id: transaction.transaction_id,
        status: transaction.status,
      },
    };
  } catch (error: any) {
    console.error("Error updating transaction status:", error);
    return {
      success: false,
      error: error.message || "Failed to update transaction status",
    };
  }
}
