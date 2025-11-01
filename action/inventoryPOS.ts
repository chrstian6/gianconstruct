// actions/inventoryPOS.ts
"use server";
import dbConnect from "@/lib/db";
import Inventory from "@/models/Inventory";
import InventoryTransaction from "@/models/InventoryTransactions";
import { InventoryItem, InventoryPOSPayment } from "@/types/inventory-pos";

// ============================================
// INVENTORY OPERATIONS
// ============================================

export async function getInventoryItems() {
  try {
    await dbConnect();

    // Only fetch essential fields for POS with limit
    const items = await Inventory.find({ quantity: { $gt: 0 } })
      .select("product_id name category quantity unit salePrice unitCost")
      .limit(200) // Limit results to prevent over-fetching
      .lean()
      .exec();

    const formattedItems: InventoryItem[] = items.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      salePrice: item.salePrice || item.unitCost || 0,
      unitCost: item.unitCost || 0,
      description: "", // Skip description for performance
      supplier: "", // Skip supplier for performance
      location: "", // Skip location for performance
      reorderPoint: 0, // Skip reorderPoint for performance
    }));

    return {
      success: true,
      items: formattedItems,
    };
  } catch (error: any) {
    console.error("Error fetching inventory items:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch inventory items",
      items: [],
    };
  }
}

export async function getInventoryItemByProductId(productId: string) {
  try {
    await dbConnect();
    const item = await Inventory.findOne({ product_id: productId })
      .lean()
      .exec();

    if (!item) {
      return {
        success: false,
        error: "Item not found",
        item: null,
      };
    }

    const formattedItem: InventoryItem = {
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      salePrice: item.salePrice || 0,
      unitCost: item.unitCost,
      description: item.description,
      supplier: item.supplier,
      location: item.location,
      reorderPoint: item.reorderPoint,
    };

    return {
      success: true,
      item: formattedItem,
    };
  } catch (error: any) {
    console.error("Error fetching inventory item:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch inventory item",
      item: null,
    };
  }
}

export async function searchInventoryItems(searchTerm: string) {
  try {
    await dbConnect();
    const items = await Inventory.find({
      $and: [
        { quantity: { $gt: 0 } },
        {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { product_id: { $regex: searchTerm, $options: "i" } },
            { category: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        },
      ],
    })
      .select(
        "product_id name category quantity unit salePrice unitCost description supplier location reorderPoint"
      )
      .limit(20)
      .lean()
      .exec();

    const formattedItems: InventoryItem[] = items.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      salePrice: item.salePrice || 0,
      unitCost: item.unitCost,
      description: item.description,
      supplier: item.supplier,
      location: item.location,
      reorderPoint: item.reorderPoint,
    }));

    return {
      success: true,
      items: formattedItems,
    };
  } catch (error: any) {
    console.error("Error searching inventory:", error);
    return {
      success: false,
      error: error.message || "Failed to search inventory",
      items: [],
    };
  }
}

export async function getInventoryByCategory(category: string) {
  try {
    await dbConnect();
    const items = await Inventory.find({
      category: { $regex: category, $options: "i" },
      quantity: { $gt: 0 },
    })
      .select(
        "product_id name category quantity unit salePrice unitCost description supplier location reorderPoint"
      )
      .lean()
      .exec();

    const formattedItems: InventoryItem[] = items.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      salePrice: item.salePrice || 0,
      unitCost: item.unitCost,
      description: item.description,
      supplier: item.supplier,
      location: item.location,
      reorderPoint: item.reorderPoint,
    }));

    return {
      success: true,
      items: formattedItems,
    };
  } catch (error: any) {
    console.error("Error fetching inventory by category:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch inventory by category",
      items: [],
    };
  }
}

export async function getLowStockItems() {
  try {
    await dbConnect();
    const items = await Inventory.find({
      $expr: { $lte: ["$quantity", "$reorderPoint"] },
    })
      .select(
        "product_id name category quantity unit salePrice unitCost reorderPoint location"
      )
      .lean()
      .exec();

    const formattedItems: InventoryItem[] = items.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      salePrice: item.salePrice || 0,
      unitCost: item.unitCost,
      reorderPoint: item.reorderPoint,
      location: item.location,
    }));

    return {
      success: true,
      items: formattedItems,
    };
  } catch (error: any) {
    console.error("Error fetching low stock items:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch low stock items",
      items: [],
    };
  }
}

export async function updateInventoryQuantity(
  productId: string,
  quantityDeducted: number
) {
  try {
    await dbConnect();
    const item = await Inventory.findOne({ product_id: productId });

    if (!item) {
      return {
        success: false,
        error: "Item not found",
      };
    }

    if (item.quantity < quantityDeducted) {
      return {
        success: false,
        error: "Insufficient quantity in inventory",
      };
    }

    item.quantity -= quantityDeducted;
    await item.save();

    return {
      success: true,
      message: "Inventory updated successfully",
      newQuantity: item.quantity,
    };
  } catch (error: any) {
    console.error("Error updating inventory:", error);
    return {
      success: false,
      error: error.message || "Failed to update inventory",
    };
  }
}

export async function getInventoryStatistics() {
  try {
    await dbConnect();

    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalCapitalValue: {
            $sum: { $multiply: ["$quantity", "$unitCost"] },
          },
          totalSaleValue: {
            $sum: { $multiply: ["$quantity", "$salePrice"] },
          },
          averageUnitCost: { $avg: "$unitCost" },
          averageSalePrice: { $avg: "$salePrice" },
        },
      },
    ]);

    const categoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalValue: {
            $sum: { $multiply: ["$quantity", "$salePrice"] },
          },
        },
      },
      { $sort: { totalValue: -1 } },
    ]);

    return {
      success: true,
      statistics: stats[0] || {},
      categoryStats,
    };
  } catch (error: any) {
    console.error("Error fetching inventory statistics:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch inventory statistics",
      statistics: {},
      categoryStats: [],
    };
  }
}

// ============================================
// POS TRANSACTION OPERATIONS
// ============================================

export async function createInventoryPOSPayment(
  paymentData: InventoryPOSPayment
) {
  try {
    await dbConnect();

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

// NEW FUNCTION: Get full transaction details for receipt history
export async function getFullInventoryPOSTransaction(transactionId: string) {
  try {
    await dbConnect();

    const transaction = await InventoryTransaction.findOne({
      transaction_id: transactionId,
    }).lean();

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
        transaction: null,
      };
    }

    const fullTransaction: InventoryPOSPayment = {
      id: transaction.transaction_id,
      referenceNumber: transaction.referenceNumber,
      transactionDate: transaction.transactionDate.toISOString(),
      clientInfo: {
        clientName: transaction.clientName,
        clientEmail: transaction.clientEmail,
        clientPhone: transaction.clientPhone,
        clientAddress: transaction.clientAddress,
      },
      paymentMethod: transaction.paymentMethod,
      paymentType: transaction.paymentType,
      items: transaction.items.map((item: any) => ({
        product_id: item.product_id,
        name: item.name,
        category: item.category || "Uncategorized",
        quantity: item.quantity,
        unit: "pcs",
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        availableQuantity: 0,
        description: "",
      })),
      subtotal: transaction.subtotal,
      discountAmount: transaction.discountAmount,
      discountPercentage: transaction.discountPercentage,
      taxAmount: transaction.taxAmount,
      taxPercentage: transaction.taxPercentage,
      totalAmount: transaction.totalAmount,
      amountPaid: transaction.amountPaid,
      change: transaction.change,
      status: transaction.status as
        | "completed"
        | "pending"
        | "failed"
        | "voided",
      notes: transaction.notes,
    };

    return {
      success: true,
      transaction: fullTransaction,
    };
  } catch (error: any) {
    console.error("Error fetching full transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transaction details",
      transaction: null,
    };
  }
}

// NEW FUNCTION: Track sales adjustments for voided transactions
export async function adjustSalesForVoidedTransaction(transactionId: string) {
  try {
    await dbConnect();

    const transaction = await InventoryTransaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    // Calculate the amount to subtract from total sales
    const amountToSubtract = transaction.totalAmount;

    // Log the sales adjustment for tracking purposes
    console.log(
      `[SALES ADJUSTMENT] Subtracting ₱${amountToSubtract} from total sales for voided transaction ${transactionId}`
    );

    return {
      success: true,
      amountSubtracted: amountToSubtract,
      message: `₱${amountToSubtract.toFixed(2)} subtracted from total sales`,
    };
  } catch (error: any) {
    console.error("Error adjusting sales for voided transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to adjust sales",
    };
  }
}

// UPDATED FUNCTION: Enhanced void transaction with sales subtraction
export async function voidInventoryPOSTransaction(
  transactionId: string,
  reason?: string
) {
  try {
    await dbConnect();

    const transaction = await InventoryTransaction.findOne({
      transaction_id: transactionId,
    });

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    if (transaction.status === "voided") {
      return {
        success: false,
        error: "Transaction is already voided",
      };
    }

    // Store the original amount for sales adjustment
    const originalAmount = transaction.totalAmount;

    // Update to "voided" status
    transaction.status = "voided";
    transaction.notes = reason
      ? `VOIDED: ${reason}`
      : "VOIDED: No reason provided";
    transaction.updatedAt = new Date();

    await transaction.save();

    // Restore inventory quantities for voided items
    for (const item of transaction.items) {
      await Inventory.findOneAndUpdate(
        { product_id: item.product_id },
        { $inc: { quantity: item.quantity } }
      );
    }

    // Subtract from total sales
    const salesAdjustment =
      await adjustSalesForVoidedTransaction(transactionId);

    return {
      success: true,
      message: "Transaction voided successfully",
      transaction: {
        id: transaction.transaction_id,
        status: transaction.status,
        referenceNumber: transaction.referenceNumber,
        amountSubtracted: originalAmount,
        salesAdjustment: salesAdjustment.success
          ? salesAdjustment.message
          : "Sales adjustment logged",
      },
    };
  } catch (error: any) {
    console.error("Error voiding transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to void transaction",
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

// UPDATED FUNCTION: Enhanced revenue calculation that excludes voided transactions
export async function getInventoryPOSRevenue(
  startDate?: string,
  endDate?: string
) {
  try {
    await dbConnect();

    // EXCLUDE voided transactions from revenue calculation
    const query: any = {
      status: {
        $in: ["completed", "pending"], // Only include completed and pending transactions
      },
    };

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

    // Calculate voided transactions separately for reporting
    const voidQuery: any = {
      status: "voided",
    };

    if (startDate && endDate) {
      voidQuery.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const voidedStats = await InventoryTransaction.aggregate([
      { $match: voidQuery },
      {
        $group: {
          _id: null,
          totalVoidedAmount: { $sum: "$totalAmount" },
          totalVoidedTransactions: { $sum: 1 },
          totalVoidedItems: { $sum: { $sum: "$items.quantity" } },
        },
      },
    ]);

    const revenueData = revenue[0] || {
      totalRevenue: 0,
      totalSubtotal: 0,
      totalTransactions: 0,
      totalItemsSold: 0,
      totalDiscount: 0,
      totalTax: 0,
      averageTransactionValue: 0,
      averageDiscount: 0,
    };

    const voidedData = voidedStats[0] || {
      totalVoidedAmount: 0,
      totalVoidedTransactions: 0,
      totalVoidedItems: 0,
    };

    return {
      success: true,
      revenue: {
        ...revenueData,
        ...voidedData,
        // Calculate net revenue (gross - voided)
        netRevenue: revenueData.totalRevenue - voidedData.totalVoidedAmount,
        netTransactions:
          revenueData.totalTransactions - voidedData.totalVoidedTransactions,
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

    const query: any = {
      status: { $in: ["completed", "pending"] }, // Exclude voided transactions
    };

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
      { $match: { status: { $in: ["completed", "pending"] } } }, // Exclude voided transactions
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
  status: "completed" | "pending" | "failed" | "voided"
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

// NEW FUNCTION: Get sales statistics including voided transactions
export async function getSalesStatisticsWithVoids(
  startDate?: string,
  endDate?: string
) {
  try {
    await dbConnect();

    const baseQuery: any = {};
    if (startDate && endDate) {
      baseQuery.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get all transactions grouped by status
    const stats = await InventoryTransaction.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalItems: { $sum: { $sum: "$items.quantity" } },
        },
      },
    ]);

    // Calculate totals
    const totalStats = {
      completed: { count: 0, totalAmount: 0, totalItems: 0 },
      pending: { count: 0, totalAmount: 0, totalItems: 0 },
      voided: { count: 0, totalAmount: 0, totalItems: 0 },
      failed: { count: 0, totalAmount: 0, totalItems: 0 },
    };

    stats.forEach((stat) => {
      const status = stat._id;
      if (totalStats[status as keyof typeof totalStats]) {
        totalStats[status as keyof typeof totalStats] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
          totalItems: stat.totalItems,
        };
      }
    });

    const grossRevenue =
      totalStats.completed.totalAmount + totalStats.pending.totalAmount;
    const voidedRevenue = totalStats.voided.totalAmount;

    return {
      success: true,
      statistics: {
        grossRevenue,
        voidedRevenue,
        netRevenue: grossRevenue - voidedRevenue,
        totalTransactions:
          totalStats.completed.count +
          totalStats.pending.count +
          totalStats.voided.count +
          totalStats.failed.count,
        validTransactions:
          totalStats.completed.count + totalStats.pending.count,
        voidedTransactions: totalStats.voided.count,
        byStatus: totalStats,
      },
    };
  } catch (error: any) {
    console.error("Error fetching sales statistics:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch sales statistics",
      statistics: null,
    };
  }
}
