// types/project.ts
import { z } from "zod";

export interface ProjectLocation {
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  fullAddress: string;
}

export const TimelineEntryZodSchema = z
  .object({
    date: z.date({ required_error: "Timeline entry date is required" }),
    photoUrls: z.array(z.string().url()).optional(),
    caption: z.string().trim().optional(),
    photoUrl: z
      .string()
      .url()
      .optional()
      .transform((val) => (val ? [val] : undefined)),
  })
  .transform((data) => ({
    date: data.date,
    photoUrls: data.photoUrls || data.photoUrl,
    caption: data.caption,
  }));

export const ProjectPreSaveZodSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Name is required").trim(),
  status: z
    .enum(["not-started", "pending", "active", "completed", "cancelled"])
    .default("not-started"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional(),
  userId: z.string().min(1, "User ID is required"),
  totalCost: z
    .number()
    .min(0, "Total cost must be a positive number")
    .optional(),
  timeline: z.array(TimelineEntryZodSchema).optional(),
  location: z
    .object({
      region: z.string().min(1, "Region is required").trim(),
      province: z.string().min(1, "Province is required").trim(),
      municipality: z.string().min(1, "Municipality is required").trim(),
      barangay: z.string().min(1, "Barangay is required").trim(),
      fullAddress: z.string().min(1, "Full address is required").trim(),
    })
    .optional(),
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
  status: z.enum(["not-started", "in-progress", "completed", "pending"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.date().optional().nullable(),
  assignedTo: z
    .string()
    .max(100, "Assignee name too long")
    .optional()
    .nullable(),
  project_id: z.string().min(1, "Project ID is required").optional(),
});

export type TimelineEntry = z.infer<typeof TimelineEntryZodSchema>;
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
