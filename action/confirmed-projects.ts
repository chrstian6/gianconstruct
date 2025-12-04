"use server";

import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import Transaction from "@/models/Transactions";
import { revalidatePath } from "next/cache";

// Define the response type for confirmed projects
export interface ConfirmedProject {
  id: string;
  project_id: string;
  projectName: string; // Added project name field
  clientName: string;
  totalValue: number;
  startDate: string;
  endDate?: string;
  status: "ongoing" | "completed" | "pending";
  userId: string;
  userEmail?: string;
  userPhone?: string;
  location?: {
    region?: string;
    province?: string;
    municipality?: string;
    barangay?: string;
    fullAddress?: string;
  };
  confirmedAt?: string;
}

// Define the response type for project transactions
export interface ProjectTransactionDetail {
  transaction_id: string;
  project_id: string;
  user_id: string;
  amount: number;
  total_amount: number;
  type: "downpayment" | "partial_payment" | "balance" | "full";
  status: "pending" | "paid" | "expired" | "cancelled";
  due_date: string;
  payment_deadline: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

// Define the response type for project with transactions
export interface ProjectWithTransactions {
  project: ConfirmedProject;
  transactions: ProjectTransactionDetail[];
  summary: {
    totalTransactions: number;
    totalPaid: number;
    totalPending: number;
    totalAmount: number;
    balance: number;
  };
}

// Define TypeScript types for lean results
type LeanProject = {
  _id: any;
  project_id: string;
  userId: string;
  name: string; // Project name field exists
  status: "pending" | "active" | "completed" | "cancelled";
  startDate: Date;
  endDate?: Date;
  totalCost: number;
  location?: {
    region?: string;
    province?: string;
    municipality?: string;
    barangay?: string;
    fullAddress?: string;
  };
  confirmedAt?: Date;
  __v: number;
};

type LeanUser = {
  _id: any;
  user_id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNo?: string;
  __v: number;
};

type LeanTransaction = {
  _id: any;
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
  __v: number;
};

// Helper to convert MongoDB objects to plain objects
function convertToPlainObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle ObjectId
  if (obj._id && typeof obj._id === "object" && obj._id.toString) {
    obj._id = obj._id.toString();
  }

  // Handle buffer
  if (obj.buffer && obj.buffer instanceof Buffer) {
    return obj.toString();
  }

  // Convert to plain object
  const plainObj: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          plainObj[key] = value.map((item) => convertToPlainObject(item));
        } else if (value instanceof Date) {
          plainObj[key] = value.toISOString();
        } else if (
          value._id &&
          typeof value._id === "object" &&
          value._id.toString
        ) {
          // Handle nested ObjectId
          const nestedObj = { ...value };
          nestedObj._id = value._id.toString();
          plainObj[key] = convertToPlainObject(nestedObj);
        } else if (value.buffer && value.buffer instanceof Buffer) {
          plainObj[key] = value.toString();
        } else {
          plainObj[key] = convertToPlainObject(value);
        }
      } else {
        plainObj[key] = value;
      }
    }
  }

  return plainObj;
}

// Action to get confirmed projects
export async function getConfirmedProjects(): Promise<{
  success: boolean;
  data?: (ConfirmedProject & { totalPaid: number; remainingBalance: number })[];
  error?: string;
}> {
  await dbConnect();

  try {
    console.log("📊 Fetching confirmed projects from database...");

    // Find projects that have been confirmed (status is active or completed, and has confirmedAt date)
    const projects = await Project.find({
      $or: [{ status: "active" }, { status: "completed" }],
      confirmedAt: { $exists: true, $ne: null },
    })
      .sort({ confirmedAt: -1, startDate: -1 })
      .lean<LeanProject[]>();

    console.log(`✅ Found ${projects.length} confirmed projects`);

    // Fetch user details for each project
    const confirmedProjectsPromises = projects.map(async (project) => {
      try {
        // Get user details
        let clientName = "Unknown Client";
        let userEmail: string | undefined;
        let userPhone: string | undefined;

        if (project.userId) {
          const user = await User.findOne({
            user_id: project.userId,
          }).lean<LeanUser>();
          if (user) {
            clientName =
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown Client";
            userEmail = user.email;
            userPhone = user.contactNo;
          }
        }

        // Determine status for display
        let displayStatus: "ongoing" | "completed" | "pending";
        switch (project.status) {
          case "active":
            displayStatus = "ongoing";
            break;
          case "completed":
            displayStatus = "completed";
            break;
          default:
            displayStatus = "pending";
        }

        // Get total paid amount from transactions
        let totalPaid = 0;
        const transactions = await Transaction.find({
          project_id: project.project_id,
          status: "paid",
        }).lean<LeanTransaction[]>();

        if (transactions && transactions.length > 0) {
          totalPaid = transactions.reduce(
            (sum, tx) => sum + (tx.amount || 0),
            0
          );
        }

        // Convert MongoDB location object to plain object
        let plainLocation:
          | {
              region?: string;
              province?: string;
              municipality?: string;
              barangay?: string;
              fullAddress?: string;
            }
          | undefined = undefined;

        if (project.location) {
          plainLocation = {
            region: project.location.region || undefined,
            province: project.location.province || undefined,
            municipality: project.location.municipality || undefined,
            barangay: project.location.barangay || undefined,
            fullAddress: project.location.fullAddress || undefined,
          };

          // Remove undefined values
          Object.keys(plainLocation).forEach((key) => {
            const typedKey = key as keyof typeof plainLocation;
            if (plainLocation![typedKey] === undefined) {
              delete plainLocation![typedKey];
            }
          });

          // If location object is empty after removing undefined values, set to undefined
          if (Object.keys(plainLocation).length === 0) {
            plainLocation = undefined;
          }
        }

        // Create plain object that can be serialized
        const plainProject: ConfirmedProject = {
          id: project._id?.toString() || "",
          project_id: project.project_id || "",
          projectName: project.name || "Unnamed Project", // Added project name
          clientName,
          totalValue: project.totalCost || 0,
          startDate:
            project.startDate?.toISOString() || new Date().toISOString(),
          endDate: project.endDate?.toISOString(),
          status: displayStatus,
          userId: project.userId || "",
          userEmail,
          userPhone,
          location: plainLocation,
          confirmedAt: project.confirmedAt?.toISOString(),
        };

        // Add payment info as separate properties
        return {
          ...plainProject,
          totalPaid,
          remainingBalance: (project.totalCost || 0) - totalPaid,
        };
      } catch (error) {
        console.error(`Error processing project ${project.project_id}:`, error);
        return null;
      }
    });

    const confirmedProjects = await Promise.all(confirmedProjectsPromises);

    // Filter out null results and ensure all objects are plain
    const validProjects = confirmedProjects
      .filter(
        (
          p
        ): p is ConfirmedProject & {
          totalPaid: number;
          remainingBalance: number;
        } => p !== null
      )
      .map((project) => convertToPlainObject(project));

    console.log(`✅ Processed ${validProjects.length} valid projects`);

    return {
      success: true,
      data: validProjects,
    };
  } catch (error) {
    console.error("❌ Error fetching confirmed projects:", error);
    return {
      success: false,
      error: "Failed to fetch confirmed projects from database",
    };
  }
}

// Action to get project transactions
export async function getProjectTransactions(projectId: string): Promise<{
  success: boolean;
  data?: ProjectWithTransactions;
  error?: string;
}> {
  await dbConnect();

  try {
    console.log(`📊 Fetching transactions for project: ${projectId}`);

    // Find the project
    const project = await Project.findOne({
      project_id: projectId,
    }).lean<LeanProject>();
    if (!project) {
      return {
        success: false,
        error: "Project not found",
      };
    }

    // Get user details for the project
    let clientName = "Unknown Client";
    let userEmail: string | undefined;
    let userPhone: string | undefined;

    if (project.userId) {
      const user = await User.findOne({
        user_id: project.userId,
      }).lean<LeanUser>();
      if (user) {
        clientName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unknown Client";
        userEmail = user.email;
        userPhone = user.contactNo;
      }
    }

    // Determine status for display
    let displayStatus: "ongoing" | "completed" | "pending";
    switch (project.status) {
      case "active":
        displayStatus = "ongoing";
        break;
      case "completed":
        displayStatus = "completed";
        break;
      default:
        displayStatus = "pending";
    }

    // Convert location to plain object
    let plainLocation:
      | {
          region?: string;
          province?: string;
          municipality?: string;
          barangay?: string;
          fullAddress?: string;
        }
      | undefined = undefined;

    if (project.location) {
      plainLocation = {
        region: project.location.region || undefined,
        province: project.location.province || undefined,
        municipality: project.location.municipality || undefined,
        barangay: project.location.barangay || undefined,
        fullAddress: project.location.fullAddress || undefined,
      };

      // Remove undefined values
      Object.keys(plainLocation).forEach((key) => {
        const typedKey = key as keyof typeof plainLocation;
        if (plainLocation![typedKey] === undefined) {
          delete plainLocation![typedKey];
        }
      });

      if (Object.keys(plainLocation).length === 0) {
        plainLocation = undefined;
      }
    }

    // Get all transactions for this project
    const transactions = await Transaction.find({ project_id: projectId })
      .sort({ created_at: -1 })
      .lean<LeanTransaction[]>();

    console.log(`✅ Found ${transactions.length} transactions for project`);

    // Convert transactions to plain objects and add client info
    const transactionDetails: ProjectTransactionDetail[] = transactions.map(
      (tx) => {
        const txObj = convertToPlainObject(tx);
        return {
          ...txObj,
          clientName,
          clientEmail: userEmail,
          clientPhone: userPhone,
        };
      }
    );

    // Calculate summary
    const totalPaid = transactionDetails
      .filter((tx) => tx.status === "paid")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalPending = transactionDetails
      .filter((tx) => tx.status === "pending")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalAmount = transactionDetails.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    const projectData: ConfirmedProject = {
      id: project._id?.toString() || "",
      project_id: project.project_id || "",
      projectName: project.name || "Unnamed Project", // Added project name
      clientName,
      totalValue: project.totalCost || 0,
      startDate: project.startDate?.toISOString() || new Date().toISOString(),
      endDate: project.endDate?.toISOString(),
      status: displayStatus,
      userId: project.userId || "",
      userEmail,
      userPhone,
      location: plainLocation,
      confirmedAt: project.confirmedAt?.toISOString(),
    };

    const result: ProjectWithTransactions = {
      project: projectData,
      transactions: transactionDetails,
      summary: {
        totalTransactions: transactionDetails.length,
        totalPaid,
        totalPending,
        totalAmount,
        balance: (project.totalCost || 0) - totalPaid,
      },
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error fetching project transactions:", error);
    return {
      success: false,
      error: "Failed to fetch project transactions",
    };
  }
}

// Action to get all transactions (for overview)
export async function getAllProjectTransactions(): Promise<{
  success: boolean;
  data?: ProjectTransactionDetail[];
  error?: string;
}> {
  await dbConnect();

  try {
    console.log("📊 Fetching all project transactions...");

    const transactions = await Transaction.find()
      .sort({ created_at: -1 })
      .lean<LeanTransaction[]>();

    console.log(`✅ Found ${transactions.length} total transactions`);

    // Get unique user IDs for batch lookup
    const userIds = [...new Set(transactions.map((tx) => tx.user_id))];
    const users = await User.find({ user_id: { $in: userIds } }).lean<
      LeanUser[]
    >();

    // Create user map for quick lookup
    const userMap = new Map();
    users.forEach((user) => {
      userMap.set(user.user_id, {
        clientName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        clientEmail: user.email,
        clientPhone: user.contactNo,
      });
    });

    // Convert transactions with client info
    const transactionDetails: ProjectTransactionDetail[] = transactions.map(
      (tx) => {
        const txObj = convertToPlainObject(tx);
        const userInfo = userMap.get(tx.user_id) || {
          clientName: "Unknown Client",
          clientEmail: undefined,
          clientPhone: undefined,
        };

        return {
          ...txObj,
          ...userInfo,
        };
      }
    );

    return {
      success: true,
      data: transactionDetails,
    };
  } catch (error) {
    console.error("❌ Error fetching all project transactions:", error);
    return {
      success: false,
      error: "Failed to fetch all project transactions",
    };
  }
}

// Revalidate path for confirmed projects
export async function revalidateConfirmedProjects(): Promise<void> {
  revalidatePath("/admin/transactions");
  revalidatePath("/admin/dashboard");
}
