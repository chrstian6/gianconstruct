// types/document.ts
import { z } from "zod";

export const DocumentZodSchema = z.object({
  _id: z.string().optional(),
  doc_id: z.string().min(1, "Document ID is required"),
  project_id: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Document name is required").trim(),
  original_name: z.string().min(1, "Original name is required").trim(),
  file_path: z.string().min(1, "File path is required"),
  file_url: z.string().url("File URL must be valid"),
  file_type: z.string().min(1, "File type is required"),
  file_size: z.number().min(0, "File size must be positive"),
  mime_type: z.string().min(1, "MIME type is required"),
  uploaded_by: z.string().min(1, "Uploader ID is required"),
  uploaded_by_name: z.string().min(1, "Uploader name is required"),
  uploaded_at: z.date().default(() => new Date()),
});

export const DocumentCreateZodSchema = DocumentZodSchema.omit({
  _id: true,
  doc_id: true,
  uploaded_at: true,
});

export type Document = z.infer<typeof DocumentZodSchema>;
export type DocumentCreate = z.infer<typeof DocumentCreateZodSchema>;

export interface DocumentResponse {
  success: boolean;
  document?: Document;
  documents?: Document[];
  error?: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  document?: Document;
  error?: string;
}
