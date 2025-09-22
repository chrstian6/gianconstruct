// components/admin/projects/details/Documents.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface DocumentsProps {
  projectId: string;
}

export default function Documents({ projectId }: DocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Simulate file upload
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newDocument: Document = {
        id: Date.now().toString(),
        name: files[0].name,
        type: files[0].type,
        size: formatFileSize(files[0].size),
        uploadedAt: new Date().toLocaleDateString(),
        uploadedBy: "Current User",
      };

      setDocuments((prev) => [newDocument, ...prev]);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Project Documents
        </CardTitle>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            id="document-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => document.getElementById("document-upload")?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-600">
              Upload project documents to keep them organized in one place
            </p>
            <Button
              className="mt-4"
              onClick={() =>
                document.getElementById("document-upload")?.click()
              }
            >
              Upload Document
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{document.name}</p>
                    <p className="text-sm text-gray-600">
                      {document.size} • {document.uploadedAt} •{" "}
                      {document.uploadedBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-gray-900"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-gray-900"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                    onClick={() => handleDeleteDocument(document.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
