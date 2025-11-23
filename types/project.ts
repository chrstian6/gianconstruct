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

export type ProjectImage = z.infer<typeof ProjectImageZodSchema>;
export type Project = z.infer<typeof ProjectZodSchema>;
export type Task = z.infer<typeof TaskZodSchema>;

export interface UpdateProjectResponse {
  success: boolean;
  project?: Project;
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
