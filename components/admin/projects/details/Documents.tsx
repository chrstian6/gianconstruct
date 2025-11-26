// components/admin/projects/details/Documents.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Upload, FileText } from "lucide-react";
import NotFound from "@/components/admin/NotFound";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  uploadDocument,
  deleteDocument,
  getDocumentDownloadUrl,
} from "@/action/document";

interface Document {
  id: string;
  name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  file_url: string;
}

interface DocumentsProps {
  projectId: string;
  documents: Document[];
  onDocumentsUpdate: () => void;
}

// Helper function to format date to readable format with month in words
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function Documents({
  projectId,
  documents,
  onDocumentsUpdate,
}: DocumentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadDocument(projectId, formData);

      if (result.success) {
        toast.success("Document uploaded successfully");
        onDocumentsUpdate();
      } else {
        toast.error(result.error || "Failed to upload document");
      }
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeletingId(documentId);

    try {
      const result = await deleteDocument(documentId);

      if (result.success) {
        toast.success("Document deleted successfully");
        onDocumentsUpdate();
      } else {
        toast.error(result.error || "Failed to delete document");
      }
    } catch (error) {
      toast.error("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const result = await getDocumentDownloadUrl(doc.id);

      if (result.success && result.url) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement("a");
        link.href = result.url;
        link.download = doc.original_name;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error(result.error || "Failed to download document");
      }
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Project Documents
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs rounded-md"
              disabled={isUploading}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <input
              id="file-upload"
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              accept="*/*"
              disabled={isUploading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <NotFound
            title="No documents yet"
            description="Upload project documents to keep them organized in one place"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Document</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Size</TableHead>
                <TableHead className="w-[120px]">Uploaded</TableHead>
                <TableHead className="text-right w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-gray-900 truncate">
                          {doc.original_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          Uploaded by {doc.uploaded_by}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {doc.file_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 text-sm">
                      {formatFileSize(doc.file_size)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 text-sm">
                      {formatDate(doc.uploaded_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs rounded-md border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs rounded-md border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingId === doc.id}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {deletingId === doc.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
