// types/project.ts
import { z } from "zod";

export interface ProjectLocation {
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  fullAddress: string;
}

// Add Project Image Zod Schema
export const ProjectImageZodSchema = z.object({
  url: z.string().url("Image URL must be valid"),
  title: z
    .string()
    .min(1, "Image title is required")
    .max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  uploadedAt: z.date().default(() => new Date()),
});

// Update ProjectPreSaveZodSchema to include confirmation fields - REMOVED "not-started"
export const ProjectPreSaveZodSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required").trim(),
  status: z
    .enum(["pending", "active", "completed", "cancelled"]) // REMOVED "not-started"
    .default("pending"), // CHANGED default from "not-started" to "pending"
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional(),
  userId: z.string().min(1, "User ID is required"),
  totalCost: z
    .number()
    .min(0, "Total cost must be a positive number")
    .optional(),
  projectImages: z.array(ProjectImageZodSchema).optional(),
  location: z
    .object({
      region: z.string().min(1, "Region is required").trim(),
      province: z.string().min(1, "Province is required").trim(),
      municipality: z.string().min(1, "Municipality is required").trim(),
      barangay: z.string().min(1, "Barangay is required").trim(),
      fullAddress: z.string().min(1, "Full address is required").trim(),
    })
    .optional(),
  // Add confirmation fields (optional)
  confirmedAt: z.date().optional(),
  confirmedBy: z.string().optional(),
});

export const ProjectZodSchema = ProjectPreSaveZodSchema.extend({
  _id: z.string().optional(),
  __v: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Task Zod Schema
export const TaskZodSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  status: z.enum(["pending", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional().nullable(),
  assignedTo: z
    .string()
    .max(100, "Assignee name too long")
    .optional()
    .nullable(),
  project_id: z.string().min(1, "Project ID is required").optional(),
});

// Transaction Zod Schema
export const TransactionZodSchema = z.object({
  transaction_id: z.string().min(1, "Transaction ID is required"),
  project_id: z.string().min(1, "Project ID is required"),
  user_id: z.string().min(1, "User ID is required"),
  amount: z.number().min(0, "Amount must be positive"),
  total_amount: z.number().min(0, "Total amount must be positive"),
  type: z.enum(["downpayment", "partial_payment", "balance", "full"]),
  status: z.enum(["pending", "paid", "expired", "cancelled"]),
  due_date: z.date(),
  payment_deadline: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
  paid_at: z.date().optional(),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export type ProjectImage = z.infer<typeof ProjectImageZodSchema>;
export type Project = z.infer<typeof ProjectZodSchema>;
export type Task = z.infer<typeof TaskZodSchema>;
export type Transaction = z.infer<typeof TransactionZodSchema>;

// Update the UpdateProjectResponse to include transaction
export interface UpdateProjectResponse {
  success: boolean;
  project?: Project;
  transaction?: {
    transaction_id: string;
    amount: number;
    total_amount: number;
    type: string;
    payment_deadline: Date;
    remaining_balance: number;
  };
  error?: string;
}

export interface TaskResponse {
  success: boolean;
  task?: Task;
  tasks?: Task[];
  error?: string;
}

export interface PaginatedProjectsResponse {
  projects: Project[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// Timeline Types - UPDATED with progress field
export const TimelineEntryZodSchema = z.object({
  _id: z.string().optional(),
  project_id: z.string().min(1, "Project ID is required"),
  type: z.enum([
    "project_created",
    "project_confirmed",
    "project_assigned",
    "status_update",
    "photo_update",
    "milestone",
  ]),
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().optional(),
  photoUrls: z.array(z.string().url()).optional(),
  status: z.enum(["pending", "active", "completed", "cancelled"]).optional(), // REMOVED "not-started"
  assignedTo: z.string().optional(),
  progress: z.number().min(0).max(100).optional(), // NEW: Progress field
  date: z.date({ required_error: "Date is required" }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TimelineEntry = z.infer<typeof TimelineEntryZodSchema>;

export interface TimelineResponse {
  success: boolean;
  timeline?: TimelineEntry[];
  entry?: TimelineEntry;
  error?: string;
}

export interface GalleryResponse {
  success: boolean;
  images?: Array<{
    url: string;
    title: string;
    description?: string;
    project_id: string;
    project_name: string;
    uploadedAt: Date;
  }>;
  error?: string;
}

// Transaction Response Types
export interface TransactionResponse {
  success: boolean;
  transaction?: Transaction;
  transactions?: Transaction[];
  error?: string;
}

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

export interface PaymentSummary {
  total_cost: number;
  total_paid: number;
  total_pending: number;
  remaining_balance: number;
  paid_transactions: Transaction[];
  pending_transactions: Transaction[];
  all_transactions: Transaction[];
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  progress: number;
  target_date?: Date;
  completed: boolean;
  completed_at?: Date;
  order: number;
  created_at: Date;
  updated_at: Date;
}

// Add these interfaces to your existing types/project.ts file

export interface ProjectAssignment {
  _id: string;
  assignment_id: string;
  project_id: string;
  project_manager_id: string;
  assigned_by: string;
  assignment_date: string;
  status: "active" | "completed" | "transferred";
  notes?: string;
  transferred_to?: string;
  transferred_date?: string;
  completed_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectManager {
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string;
  address: string;
  avatar?: string;
}

export interface AssignedProject {
  project: Project;
  assignment: ProjectAssignment;
  projectManager: ProjectManager;
}

// Zod schemas for validation
export const ProjectAssignmentZodSchema = z.object({
  _id: z.string(),
  assignment_id: z.string(),
  project_id: z.string(),
  project_manager_id: z.string(),
  assigned_by: z.string(),
  assignment_date: z.string().datetime(),
  status: z.enum(["active", "completed", "transferred"]),
  notes: z.string().optional(),
  transferred_to: z.string().optional(),
  transferred_date: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AssignProjectsZodSchema = z.object({
  projectIds: z
    .array(z.string())
    .min(1, "At least one project must be selected"),
  projectManagerId: z.string().min(1, "Project manager is required"),
  notes: z.string().optional(),
});

export type AssignProjectsInput = z.infer<typeof AssignProjectsZodSchema>;
