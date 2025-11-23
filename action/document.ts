// actions/document.ts
"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Document from "@/models/Document";
import { supabaseServer } from "@/lib/supabase"; // Import server client
import { verifySession } from "@/lib/redis";
import {
  Document as DocumentType,
  DocumentCreate,
  DocumentResponse,
  DocumentUploadResponse,
  DocumentZodSchema,
  DocumentCreateZodSchema,
} from "@/types/document";
import mongoose from "mongoose";

// Counter schema for incremental document IDs
interface ICounterDocument {
  _id: string;
  sequence_value: number;
}

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

// Get or create counter model
const getCounterModel = () => {
  if (mongoose.models.Counter) {
    return mongoose.models.Counter;
  }
  return mongoose.model<ICounterDocument>("Counter", counterSchema);
};

// Generate incremental document ID
async function generateDocumentId(): Promise<string> {
  await dbConnect();
  const Counter = getCounterModel();

  const sequence = await (Counter as any).findOneAndUpdate(
    { _id: "document_id" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  const sequenceNumber = sequence.sequence_value.toString().padStart(4, "0");
  return `doc-${sequenceNumber}`;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to get file type category
function getFileTypeCategory(mimeType: string, fileName: string): string {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "Document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "Spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "Presentation";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "Archive";
  if (mimeType.includes("text")) return "Text";

  // Fallback based on file extension
  const ext = fileName.split(".").pop()?.toLowerCase();
  const extensionMap: { [key: string]: string } = {
    doc: "Document",
    docx: "Document",
    xls: "Spreadsheet",
    xlsx: "Spreadsheet",
    ppt: "Presentation",
    pptx: "Presentation",
    txt: "Text",
    zip: "Archive",
    rar: "Archive",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    pdf: "PDF",
  };

  return extensionMap[ext || ""] || "File";
}

// Define proper TypeScript interfaces for MongoDB documents
interface MongoDocument {
  _id: mongoose.Types.ObjectId;
  doc_id: string;
  project_id: string;
  name: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

// Upload document to Supabase
export async function uploadDocument(
  projectId: string,
  formData: FormData
): Promise<DocumentUploadResponse> {
  await dbConnect();

  try {
    // Check if user is authenticated
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File size too large. Maximum size is 50MB.",
      };
    }

    // Generate unique file name and document ID
    const timestamp = Date.now();
    const originalName = file.name;
    const fileExtension = originalName.split(".").pop();
    const fileName = `doc-${timestamp}.${fileExtension}`;
    const filePath = `${projectId}/${fileName}`;
    const doc_id = await generateDocumentId();

    // Upload file to Supabase using server client (bypasses RLS)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } =
      await supabaseServer.storage
        .from("project-documents")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return {
        success: false,
        error: `Failed to upload file: ${uploadError.message}`,
      };
    }

    // Get public URL using server client
    const { data: publicUrlData } = supabaseServer.storage
      .from("project-documents")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    // Create document record in database
    const documentData: DocumentCreate = {
      project_id: projectId,
      name: fileName,
      original_name: originalName,
      file_path: filePath,
      file_url: fileUrl,
      file_type: getFileTypeCategory(file.type, originalName),
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: session.userId || "unknown",
      uploaded_by_name: session.firstName || "Unknown User",
    };

    // Validate document data
    DocumentCreateZodSchema.parse(documentData);

    const document = await Document.create({
      ...documentData,
      doc_id: doc_id,
    });

    // Type assertion to fix TypeScript error
    const mongoDoc = document as unknown as MongoDocument;

    const plainDocument: DocumentType = DocumentZodSchema.parse({
      _id: mongoDoc._id.toString(),
      doc_id: mongoDoc.doc_id,
      project_id: mongoDoc.project_id,
      name: mongoDoc.name,
      original_name: mongoDoc.original_name,
      file_path: mongoDoc.file_path,
      file_url: mongoDoc.file_url,
      file_type: mongoDoc.file_type,
      file_size: mongoDoc.file_size,
      mime_type: mongoDoc.mime_type,
      uploaded_by: mongoDoc.uploaded_by,
      uploaded_by_name: mongoDoc.uploaded_by_name,
      uploaded_at: new Date(mongoDoc.uploaded_at),
    });

    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, document: plainDocument };
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error:
        "Failed to upload document: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Get documents for a project
export async function getProjectDocuments(
  projectId: string
): Promise<DocumentResponse> {
  await dbConnect();

  try {
    const documents = await Document.find({ project_id: projectId })
      .sort({ uploaded_at: -1 })
      .lean();

    const convertedDocuments = documents
      .map((doc: any) => {
        try {
          // Type assertion to fix TypeScript error
          const mongoDoc = doc as MongoDocument;

          return DocumentZodSchema.parse({
            _id: mongoDoc._id.toString(),
            doc_id: mongoDoc.doc_id,
            project_id: mongoDoc.project_id,
            name: mongoDoc.name,
            original_name: mongoDoc.original_name,
            file_path: mongoDoc.file_path,
            file_url: mongoDoc.file_url,
            file_type: mongoDoc.file_type,
            file_size: mongoDoc.file_size,
            mime_type: mongoDoc.mime_type,
            uploaded_by: mongoDoc.uploaded_by,
            uploaded_by_name: mongoDoc.uploaded_by_name,
            uploaded_at: new Date(mongoDoc.uploaded_at),
          });
        } catch (parseError) {
          console.error(
            `Validation error for document ${doc._id}:`,
            parseError
          );
          return null;
        }
      })
      .filter((doc): doc is DocumentType => doc !== null);

    return { success: true, documents: convertedDocuments };
  } catch (error) {
    console.error("Error fetching project documents:", error);
    return { success: false, error: "Failed to fetch documents" };
  }
}

// Delete document
export async function deleteDocument(
  documentId: string
): Promise<DocumentResponse> {
  await dbConnect();

  try {
    // Check if user is authenticated
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" };
    }

    // Find the document first
    const document = await Document.findById(documentId);
    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Type assertion to fix TypeScript error
    const mongoDoc = document as unknown as MongoDocument;

    // Delete file from Supabase storage using server client
    const { error: deleteError } = await supabaseServer.storage
      .from("project-documents")
      .remove([mongoDoc.file_path]);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document from database
    await Document.findByIdAndDelete(documentId);

    revalidatePath(`/admin/projects/${mongoDoc.project_id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error:
        "Failed to delete document: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}

// Download document (returns signed URL for private files)
export async function getDocumentDownloadUrl(
  documentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  await dbConnect();

  try {
    const document = await Document.findById(documentId);
    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Type assertion to fix TypeScript error
    const mongoDoc = document as unknown as MongoDocument;

    // For private buckets, generate a signed URL with expiry using server client
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseServer.storage
        .from("project-documents")
        .createSignedUrl(mongoDoc.file_path, 60 * 60); // 1 hour expiry

    if (signedUrlError) {
      console.error("Supabase signed URL error:", signedUrlError);

      // Fallback to public URL if signed URL fails
      const { data: publicUrlData } = supabaseServer.storage
        .from("project-documents")
        .getPublicUrl(mongoDoc.file_path);

      return {
        success: true,
        url: publicUrlData.publicUrl,
      };
    }

    return {
      success: true,
      url: signedUrlData.signedUrl,
    };
  } catch (error) {
    console.error("Error getting download URL:", error);
    return {
      success: false,
      error: "Failed to get download URL",
    };
  }
}

// Get document preview URL (for viewing in browser)
export async function getDocumentPreviewUrl(
  documentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  await dbConnect();

  try {
    const document = await Document.findById(documentId);
    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Type assertion to fix TypeScript error
    const mongoDoc = document as unknown as MongoDocument;

    // For preview, we can use the public URL or create a signed URL with longer expiry
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseServer.storage
        .from("project-documents")
        .createSignedUrl(mongoDoc.file_path, 60 * 60 * 24); // 24 hours expiry for preview

    if (signedUrlError) {
      console.error("Supabase signed URL error:", signedUrlError);

      // Fallback to public URL
      const { data: publicUrlData } = supabaseServer.storage
        .from("project-documents")
        .getPublicUrl(mongoDoc.file_path);

      return {
        success: true,
        url: publicUrlData.publicUrl,
      };
    }

    return {
      success: true,
      url: signedUrlData.signedUrl,
    };
  } catch (error) {
    console.error("Error getting preview URL:", error);
    return {
      success: false,
      error: "Failed to get preview URL",
    };
  }
}

// Get document by ID
export async function getDocumentById(
  documentId: string
): Promise<DocumentResponse> {
  await dbConnect();

  try {
    const document = await Document.findById(documentId).lean();
    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Type assertion to fix TypeScript error
    const mongoDoc = document as MongoDocument;

    const plainDocument: DocumentType = DocumentZodSchema.parse({
      _id: mongoDoc._id.toString(),
      doc_id: mongoDoc.doc_id,
      project_id: mongoDoc.project_id,
      name: mongoDoc.name,
      original_name: mongoDoc.original_name,
      file_path: mongoDoc.file_path,
      file_url: mongoDoc.file_url,
      file_type: mongoDoc.file_type,
      file_size: mongoDoc.file_size,
      mime_type: mongoDoc.mime_type,
      uploaded_by: mongoDoc.uploaded_by,
      uploaded_by_name: mongoDoc.uploaded_by_name,
      uploaded_at: new Date(mongoDoc.uploaded_at),
    });

    return { success: true, document: plainDocument };
  } catch (error) {
    console.error("Error fetching document:", error);
    return { success: false, error: "Failed to fetch document" };
  }
}

// Update document metadata
export async function updateDocumentMetadata(
  documentId: string,
  updates: { name?: string; original_name?: string }
): Promise<DocumentResponse> {
  await dbConnect();

  try {
    // Check if user is authenticated
    const session = await verifySession();
    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" };
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      return { success: false, error: "Document not found" };
    }

    // Type assertion to fix TypeScript error
    const mongoDoc = updatedDocument as unknown as MongoDocument;

    const plainDocument: DocumentType = DocumentZodSchema.parse({
      _id: mongoDoc._id.toString(),
      doc_id: mongoDoc.doc_id,
      project_id: mongoDoc.project_id,
      name: mongoDoc.name,
      original_name: mongoDoc.original_name,
      file_path: mongoDoc.file_path,
      file_url: mongoDoc.file_url,
      file_type: mongoDoc.file_type,
      file_size: mongoDoc.file_size,
      mime_type: mongoDoc.mime_type,
      uploaded_by: mongoDoc.uploaded_by,
      uploaded_by_name: mongoDoc.uploaded_by_name,
      uploaded_at: new Date(mongoDoc.uploaded_at),
    });

    revalidatePath(`/admin/projects/${mongoDoc.project_id}`);
    return { success: true, document: plainDocument };
  } catch (error) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error:
        "Failed to update document: " +
        (error instanceof Error ? error.message : String(error)),
    };
  }
}
