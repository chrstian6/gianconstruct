// actions/pdc.ts
"use server";

import dbConnect from "@/lib/db";
import PDC, { IPDC } from "@/models/Pdc";
import Inventory, { IInventoryDoc } from "@/models/Inventory";
import {
  PDC as PDCType,
  PDCCreateData,
  PDCStatusUpdate,
  PDCSearchCriteria,
  PDCStats,
  PDCWithItems,
} from "@/types/pdc";
import { notificationService } from "@/lib/notification-services";

// Function to check and auto-issue PDCs based on check date
async function checkAndAutoIssuePDCs(): Promise<void> {
  try {
    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    // Find pending PDCs where check date is today or in the past
    const pendingPDCs = await PDC.find({
      status: "pending",
      checkDate: { $lte: today },
    });

    for (const pdc of pendingPDCs) {
      console.log(
        `🔄 Auto-issuing PDC: ${pdc.checkNumber} with check date: ${pdc.checkDate}`
      );

      // Update status to issued
      pdc.status = "issued";
      pdc.issuedAt = new Date();
      pdc.updatedAt = new Date();

      await pdc.save();

      // Send notification for auto-issued PDC
      await sendPDCIssuedNotification(pdc);

      console.log(`✅ Auto-issued PDC: ${pdc.checkNumber}`);
    }

    if (pendingPDCs.length > 0) {
      console.log(`🎯 Auto-issued ${pendingPDCs.length} PDC(s)`);
    }
  } catch (error) {
    console.error("❌ Failed to auto-issue PDCs:", error);
  }
}

// Check for PDCs to auto-issue when server starts
checkAndAutoIssuePDCs();

// Set up interval to check for PDCs to auto-issue daily
if (typeof setInterval !== "undefined") {
  setInterval(checkAndAutoIssuePDCs, 24 * 60 * 60 * 1000); // Check every 24 hours
}

// Helper function to send PDC created notification
async function sendPDCCreatedNotification(pdc: any): Promise<void> {
  try {
    console.log("📢 Sending PDC created notification");

    // Format the check date
    const checkDate = new Date(pdc.checkDate);
    const formattedDate = checkDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Calculate days until check date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDateTime = new Date(pdc.checkDate);
    checkDateTime.setHours(0, 0, 0, 0);
    const timeDiff = checkDateTime.getTime() - today.getTime();
    const daysUntilCheck = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Format amount
    const formattedAmount = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pdc.totalAmount);

    // Notification message
    const message = `New PDC ${pdc.checkNumber} has been created for ${pdc.supplier || "Supplier"}. Amount: ${formattedAmount}. Check Date: ${formattedDate} (${daysUntilCheck > 0 ? `in ${daysUntilCheck} days` : "today"}).`;

    // Send notification to admin
    await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "general",
      type: "system_alert",
      title: `New PDC Created: ${pdc.checkNumber}`,
      message: message,
      channels: ["in_app", "email"],
      metadata: {
        pdcId: pdc._id?.toString() || pdc.pdc_id,
        checkNumber: pdc.checkNumber,
        supplier: pdc.supplier,
        amount: pdc.totalAmount,
        checkDate: pdc.checkDate,
        formattedAmount: formattedAmount,
        formattedDate: formattedDate,
        itemCount: pdc.itemCount || pdc.items?.length || 0,
        daysUntilCheck: daysUntilCheck,
        status: pdc.status,
        action: "created",
      },
      actionUrl: `/admin/pdc`,
      actionLabel: "View PDC",
    });

    console.log(`✅ PDC created notification sent for ${pdc.checkNumber}`);
  } catch (error) {
    console.error("❌ Failed to send PDC created notification:", error);
  }
}

// Helper function to send PDC issued notification
async function sendPDCIssuedNotification(pdc: any): Promise<void> {
  try {
    console.log("📢 Sending PDC issued notification");

    // Format the check date
    const checkDate = new Date(pdc.checkDate);
    const formattedDate = checkDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Format amount
    const formattedAmount = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pdc.totalAmount);

    // Notification message for admin
    const adminMessage = `PDC ${pdc.checkNumber} has been issued to ${pdc.supplier || "Supplier"}. Amount: ${formattedAmount}. Check Date: ${formattedDate}.`;

    // Send notification to admin
    await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "general",
      type: "system_alert",
      title: `PDC Issued: ${pdc.checkNumber}`,
      message: adminMessage,
      channels: ["in_app", "email"],
      metadata: {
        pdcId: pdc._id?.toString() || pdc.pdc_id,
        checkNumber: pdc.checkNumber,
        supplier: pdc.supplier,
        amount: pdc.totalAmount,
        checkDate: pdc.checkDate,
        formattedAmount: formattedAmount,
        formattedDate: formattedDate,
        itemCount: pdc.itemCount || pdc.items?.length || 0,
        issuedAt: pdc.issuedAt,
        status: pdc.status,
        action: "issued",
      },
      actionUrl: `/admin/pdc`,
      actionLabel: "View PDC",
    });

    // Send notification to supplier if email is available
    if (pdc.supplierEmail) {
      // This would require having supplier email in PDC model or fetching from suppliers
      console.log(
        `📧 PDC issued notification sent to supplier: ${pdc.supplier}`
      );
    }

    console.log(`✅ PDC issued notification sent for ${pdc.checkNumber}`);
  } catch (error) {
    console.error("❌ Failed to send PDC issued notification:", error);
  }
}

// Helper function to send PDC status update notification
async function sendPDCStatusUpdateNotification(
  pdc: any,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    console.log("📢 Sending PDC status update notification");

    // Format amount
    const formattedAmount = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pdc.totalAmount);

    // Notification message
    const message = `PDC ${pdc.checkNumber} status changed from ${oldStatus} to ${newStatus}. Amount: ${formattedAmount}. Supplier: ${pdc.supplier || "Supplier"}.`;

    // Send notification to admin
    await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "general",
      type: "system_alert",
      title: `PDC Status Updated: ${pdc.checkNumber}`,
      message: message,
      channels: ["in_app", "email"],
      metadata: {
        pdcId: pdc._id?.toString() || pdc.pdc_id,
        checkNumber: pdc.checkNumber,
        supplier: pdc.supplier,
        amount: pdc.totalAmount,
        oldStatus: oldStatus,
        newStatus: newStatus,
        formattedAmount: formattedAmount,
        updatedAt: pdc.updatedAt,
        action: "status_update",
      },
      actionUrl: `/admin/pdc`,
      actionLabel: "View PDC",
    });

    console.log(
      `✅ PDC status update notification sent for ${pdc.checkNumber}`
    );
  } catch (error) {
    console.error("❌ Failed to send PDC status update notification:", error);
  }
}

// Helper function to send PDC deleted/cancelled notification
async function sendPDCCancelledNotification(pdc: any): Promise<void> {
  try {
    console.log("📢 Sending PDC cancelled notification");

    // Format amount
    const formattedAmount = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(pdc.totalAmount);

    // Notification message
    const message = `PDC ${pdc.checkNumber} has been cancelled. Amount: ${formattedAmount}. Supplier: ${pdc.supplier || "Supplier"}.`;

    // Send notification to admin
    await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "general",
      type: "system_alert",
      title: `PDC Cancelled: ${pdc.checkNumber}`,
      message: message,
      channels: ["in_app", "email"],
      metadata: {
        pdcId: pdc._id?.toString() || pdc.pdc_id,
        checkNumber: pdc.checkNumber,
        supplier: pdc.supplier,
        amount: pdc.totalAmount,
        formattedAmount: formattedAmount,
        cancelledAt: pdc.cancelledAt || new Date(),
        status: pdc.status,
        action: "cancelled",
      },
      actionUrl: `/admin/pdc`,
      actionLabel: "View PDC",
    });

    console.log(`✅ PDC cancelled notification sent for ${pdc.checkNumber}`);
  } catch (error) {
    console.error("❌ Failed to send PDC cancelled notification:", error);
  }
}

// action/pdc.ts - Check if there's any duplicate creation
export async function createPDC(
  pdcData: PDCCreateData
): Promise<{ success: boolean; pdc?: PDCType; error?: string }> {
  try {
    await dbConnect();

    // Generate check number if not provided
    const checkNumber =
      pdcData.checkNumber || `CBC-${Date.now().toString().slice(-8)}`;

    // Check if PDC with this check number already exists
    const existingPDC = await PDC.findOne({ checkNumber });
    if (existingPDC) {
      return { success: false, error: "Check number already exists" };
    }

    // Check if check date is today or in the past, auto-issue if so
    const checkDate = new Date(pdcData.checkDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    const shouldAutoIssue = checkDate <= today;
    const status = shouldAutoIssue ? "issued" : "pending";
    const issuedAt = shouldAutoIssue ? new Date() : undefined;

    const pdc = new PDC({
      ...pdcData,
      checkNumber,
      status,
      issuedAt,
    });

    await pdc.save();

    // Convert Mongoose document to PDCType with proper typing
    const pdcDoc = pdc.toObject() as any;

    const pdcResult: PDCType = {
      pdc_id: pdcDoc._id.toString(),
      checkNumber: pdcDoc.checkNumber,
      checkDate: pdcDoc.checkDate,
      supplier: pdcDoc.supplier,
      totalAmount: pdcDoc.totalAmount,
      itemCount: pdcDoc.itemCount,
      payee: pdcDoc.payee,
      amountInWords: pdcDoc.amountInWords,
      items: pdcDoc.items,
      status: pdcDoc.status,
      notes: pdcDoc.notes,
      createdAt: pdcDoc.createdAt,
      updatedAt: pdcDoc.updatedAt,
      issuedAt: pdcDoc.issuedAt,
      cancelledAt: pdcDoc.cancelledAt,
    };

    console.log(
      `✅ PDC created successfully: ${pdcResult.checkNumber} with status: ${pdcResult.status}`
    );

    // Send notification for newly created PDC
    await sendPDCCreatedNotification(pdcResult);

    // If it was auto-issued, also send issued notification
    if (shouldAutoIssue) {
      await sendPDCIssuedNotification(pdcResult);
    }

    return {
      success: true,
      pdc: pdcResult,
    };
  } catch (error: any) {
    console.error("❌ Failed to create PDC:", error);

    if (error.code === 11000) {
      return { success: false, error: "Check number already exists" };
    }

    return { success: false, error: "Failed to create PDC record" };
  }
}

export async function getAllPDCs(): Promise<{
  success: boolean;
  pdcs?: PDCWithItems[];
  error?: string;
}> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdcs = await PDC.find().sort({ createdAt: -1 }).lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function getPDCById(
  pdc_id: string
): Promise<{ success: boolean; pdc?: PDCWithItems; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdc = await PDC.findById(pdc_id).lean();
    if (!pdc) {
      return { success: false, error: "PDC not found" };
    }

    // Get item details from inventory
    const itemDetails = await getPDCItemDetails(pdc.items);

    const pdcResult: PDCWithItems = {
      pdc_id: pdc._id.toString(),
      checkNumber: pdc.checkNumber,
      checkDate: pdc.checkDate,
      supplier: pdc.supplier,
      totalAmount: pdc.totalAmount,
      itemCount: pdc.itemCount,
      payee: pdc.payee,
      amountInWords: pdc.amountInWords,
      items: pdc.items,
      status: pdc.status,
      notes: pdc.notes,
      createdAt: pdc.createdAt,
      updatedAt: pdc.updatedAt,
      issuedAt: pdc.issuedAt,
      cancelledAt: pdc.cancelledAt,
      itemDetails,
    };

    return {
      success: true,
      pdc: pdcResult,
    };
  } catch (error) {
    console.error("Failed to fetch PDC:", error);
    return { success: false, error: "Failed to fetch PDC record" };
  }
}

export async function getPDCsByStatus(
  status: "pending" | "issued" | "cancelled"
): Promise<{ success: boolean; pdcs?: PDCWithItems[]; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    if (status === "pending") {
      await checkAndAutoIssuePDCs();
    }

    const pdcs = await PDC.find({ status })
      .sort({
        checkDate: -1,
        createdAt: -1,
      })
      .lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs by status:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function updatePDCStatus(
  pdc_id: string,
  statusUpdate: PDCStatusUpdate
): Promise<{ success: boolean; pdc?: PDCType; error?: string }> {
  try {
    await dbConnect();

    // Get current PDC to track status change
    const currentPDC = await PDC.findById(pdc_id);
    if (!currentPDC) {
      return { success: false, error: "PDC not found" };
    }

    const oldStatus = currentPDC.status;

    const updateData: any = {
      status: statusUpdate.status,
      updatedAt: new Date(),
    };

    if (statusUpdate.status === "issued") {
      updateData.issuedAt = statusUpdate.issuedAt || new Date();
    } else if (statusUpdate.status === "cancelled") {
      updateData.cancelledAt = statusUpdate.cancelledAt || new Date();
    }

    const pdc = await PDC.findByIdAndUpdate(pdc_id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!pdc) {
      return { success: false, error: "PDC not found" };
    }

    const pdcResult: PDCType = {
      pdc_id: pdc._id.toString(),
      checkNumber: pdc.checkNumber,
      checkDate: pdc.checkDate,
      supplier: pdc.supplier,
      totalAmount: pdc.totalAmount,
      itemCount: pdc.itemCount,
      payee: pdc.payee,
      amountInWords: pdc.amountInWords,
      items: pdc.items,
      status: pdc.status,
      notes: pdc.notes,
      createdAt: pdc.createdAt,
      updatedAt: pdc.updatedAt,
      issuedAt: pdc.issuedAt,
      cancelledAt: pdc.cancelledAt,
    };

    // Send notification for status update if status changed
    if (oldStatus !== statusUpdate.status) {
      await sendPDCStatusUpdateNotification(
        pdcResult,
        oldStatus,
        statusUpdate.status
      );
    }

    // Send specific notification for issued status
    if (statusUpdate.status === "issued" && oldStatus !== "issued") {
      await sendPDCIssuedNotification(pdcResult);
    }

    return {
      success: true,
      pdc: pdcResult,
    };
  } catch (error) {
    console.error("Failed to update PDC status:", error);
    return { success: false, error: "Failed to update PDC status" };
  }
}

export async function getPDCsBySupplier(
  supplier: string
): Promise<{ success: boolean; pdcs?: PDCWithItems[]; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdcs = await PDC.find({ supplier })
      .sort({
        checkDate: -1,
        createdAt: -1,
      })
      .lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs by supplier:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function getPDCsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; pdcs?: PDCWithItems[]; error?: string }> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const pdcs = await PDC.find({
      checkDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ checkDate: -1, createdAt: -1 })
      .lean();

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
    };
  } catch (error) {
    console.error("Failed to fetch PDCs by date range:", error);
    return { success: false, error: "Failed to fetch PDC records" };
  }
}

export async function getPDCStats(): Promise<{
  success: boolean;
  stats?: PDCStats;
  error?: string;
}> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const stats = await PDC.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const result: PDCStats = {
      total: 0,
      pending: 0,
      issued: 0,
      cancelled: 0,
      totalAmount: 0,
      pendingAmount: 0,
      issuedAmount: 0,
      cancelledAmount: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      result.totalAmount += stat.totalAmount;

      switch (stat._id) {
        case "pending":
          result.pending = stat.count;
          result.pendingAmount = stat.totalAmount;
          break;
        case "issued":
          result.issued = stat.count;
          result.issuedAmount = stat.totalAmount;
          break;
        case "cancelled":
          result.cancelled = stat.count;
          result.cancelledAmount = stat.totalAmount;
          break;
      }
    });

    // Send notification for PDC stats (e.g., weekly summary)
    // This could be called from a scheduled job instead
    await sendPDCStatsNotification(result);

    return { success: true, stats: result };
  } catch (error) {
    console.error("Failed to fetch PDC stats:", error);
    return { success: false, error: "Failed to fetch PDC statistics" };
  }
}

// Helper function to send PDC stats notification
async function sendPDCStatsNotification(stats: PDCStats): Promise<void> {
  try {
    console.log("📊 Sending PDC stats notification");

    const formattedTotalAmount = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(stats.totalAmount);

    const formattedIssuedAmount = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(stats.issuedAmount);

    const formattedPendingAmount = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(stats.pendingAmount);

    const message = `PDC Statistics Summary: ${stats.total} total PDCs (₱${stats.totalAmount.toLocaleString()}). ${stats.issued} issued (₱${stats.issuedAmount.toLocaleString()}), ${stats.pending} pending (₱${stats.pendingAmount.toLocaleString()}), ${stats.cancelled} cancelled (₱${stats.cancelledAmount.toLocaleString()}).`;

    // Send notification to admin
    await notificationService.createNotification({
      targetUserRoles: ["admin"],
      feature: "general",
      type: "system_alert",
      title: "PDC Statistics Summary",
      message: message,
      channels: ["in_app", "email"],
      metadata: {
        totalPDCs: stats.total,
        totalAmount: stats.totalAmount,
        issuedPDCs: stats.issued,
        issuedAmount: stats.issuedAmount,
        pendingPDCs: stats.pending,
        pendingAmount: stats.pendingAmount,
        cancelledPDCs: stats.cancelled,
        cancelledAmount: stats.cancelledAmount,
        formattedTotalAmount: formattedTotalAmount,
        formattedIssuedAmount: formattedIssuedAmount,
        formattedPendingAmount: formattedPendingAmount,
        action: "stats_summary",
      },
      actionUrl: `/admin/pdc`,
      actionLabel: "View PDC Dashboard",
    });

    console.log("✅ PDC stats notification sent");
  } catch (error) {
    console.error("❌ Failed to send PDC stats notification:", error);
  }
}

export async function getPDCItems(
  pdc_id: string
): Promise<{ success: boolean; items?: any[]; error?: string }> {
  try {
    await dbConnect();

    const pdc = await PDC.findById(pdc_id).lean();
    if (!pdc) {
      return { success: false, error: "PDC not found" };
    }

    // Get full item details from inventory
    const itemDetails = await getPDCItemDetails(pdc.items);

    return {
      success: true,
      items: itemDetails,
    };
  } catch (error) {
    console.error("Failed to fetch PDC items:", error);
    return { success: false, error: "Failed to fetch PDC items" };
  }
}

export async function searchPDCs(criteria: PDCSearchCriteria): Promise<{
  success: boolean;
  pdcs?: PDCWithItems[];
  total?: number;
  error?: string;
}> {
  try {
    await dbConnect();

    // First, check for any PDCs that need auto-issuing
    await checkAndAutoIssuePDCs();

    const {
      checkNumber,
      supplier,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = criteria;

    const query: any = {};

    if (checkNumber) {
      query.checkNumber = { $regex: checkNumber, $options: "i" };
    }

    if (supplier) {
      query.supplier = { $regex: supplier, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.checkDate = {};
      if (dateFrom) query.checkDate.$gte = dateFrom;
      if (dateTo) query.checkDate.$lte = dateTo;
    }

    const skip = (page - 1) * limit;

    const [pdcs, total] = await Promise.all([
      PDC.find(query)
        .sort({ checkDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PDC.countDocuments(query),
    ]);

    // Get item details for all PDCs
    const pdcsWithItems: PDCWithItems[] = await Promise.all(
      pdcs.map(async (pdc: any) => {
        const itemDetails = await getPDCItemDetails(pdc.items);

        return {
          pdc_id: pdc._id.toString(),
          checkNumber: pdc.checkNumber,
          checkDate: pdc.checkDate,
          supplier: pdc.supplier,
          totalAmount: pdc.totalAmount,
          itemCount: pdc.itemCount,
          payee: pdc.payee,
          amountInWords: pdc.amountInWords,
          items: pdc.items,
          status: pdc.status,
          notes: pdc.notes,
          createdAt: pdc.createdAt,
          updatedAt: pdc.updatedAt,
          issuedAt: pdc.issuedAt,
          cancelledAt: pdc.cancelledAt,
          itemDetails,
        };
      })
    );

    return {
      success: true,
      pdcs: pdcsWithItems,
      total,
    };
  } catch (error) {
    console.error("Failed to search PDCs:", error);
    return { success: false, error: "Failed to search PDC records" };
  }
}

export async function deletePDC(
  pdc_id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbConnect();

    // Get PDC before deletion for notification
    const pdc = await PDC.findById(pdc_id);
    if (!pdc) {
      return { success: false, error: "PDC not found" };
    }

    // Soft delete by updating status to cancelled
    const result = await PDC.findByIdAndUpdate(pdc_id, {
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    });

    if (!result) {
      return { success: false, error: "PDC not found" };
    }

    // Send notification for cancelled PDC
    await sendPDCCancelledNotification(pdc);

    return { success: true };
  } catch (error) {
    console.error("Failed to delete PDC:", error);
    return { success: false, error: "Failed to delete PDC record" };
  }
}

// Helper function to get item details from inventory
async function getPDCItemDetails(items: any[]): Promise<any[]> {
  try {
    await dbConnect();

    // Get all inventory items that match the PDC items
    const productIds = items.map((item) => item.product_id);

    // Filter out any temporary or invalid product IDs
    const validProductIds = productIds.filter(
      (id) => id && typeof id === "string" && !id.startsWith("temp-")
    );

    let inventoryItems: any[] = [];

    if (validProductIds.length > 0) {
      // Use type assertion to handle the lean() result
      inventoryItems = await Inventory.find({
        product_id: { $in: validProductIds },
      }).lean();
    }

    if (!inventoryItems || inventoryItems.length === 0) {
      return items.map((item) => ({
        ...item,
        name: "Unknown Item",
        category: "Unknown Category",
        unit: "N/A",
        description: "",
        currentQuantity: 0,
        currentUnitCost: item.unitCost || 0,
        salePrice: 0,
        location: "",
        reorderPoint: 0,
      }));
    }

    // Map PDC items with their full details from inventory
    const itemDetails = items.map((pdcItem) => {
      const inventoryItem = inventoryItems.find(
        (invItem) => invItem.product_id === pdcItem.product_id
      );

      // Extract data from plain object (not Mongoose document)
      const plainInvItem = inventoryItem || {};

      // Calculate virtual fields manually
      const quantity = plainInvItem.quantity || 0;
      const unitCost = plainInvItem.unitCost || 0;
      const salePrice = plainInvItem.salePrice || 0;

      const totalCapital = quantity * unitCost;
      const totalValue = quantity * salePrice;

      return {
        ...pdcItem,
        name: plainInvItem.name || "Unknown Item",
        category: plainInvItem.category || "Unknown Category",
        unit: plainInvItem.unit || "N/A",
        description: plainInvItem.description || "",
        currentQuantity: quantity,
        currentUnitCost: unitCost,
        salePrice: salePrice,
        location: plainInvItem.location || "",
        reorderPoint: plainInvItem.reorderPoint || 0,
        totalCapital,
        totalValue,
        timeCreated: plainInvItem.timeCreated,
        timeUpdated: plainInvItem.timeUpdated,
      };
    });

    return itemDetails;
  } catch (error) {
    console.error("Failed to get PDC item details:", error);
    // Return items with basic info on error
    return items.map((item) => ({
      ...item,
      name: "Unknown Item",
      category: "Unknown Category",
      unit: "N/A",
      description: "",
      currentQuantity: 0,
      currentUnitCost: item.unitCost || 0,
      salePrice: 0,
      location: "",
      reorderPoint: 0,
      totalCapital: 0,
      totalValue: 0,
    }));
  }
}

// Export the auto-issue function for manual triggering if needed
export { checkAndAutoIssuePDCs };
