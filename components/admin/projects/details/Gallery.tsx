// components/admin/projects/details/Gallery.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload, Trash2, ZoomIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface GalleryProps {
  projectId: string;
}

export default function Gallery({ projectId }: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Simulate image upload and processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newImage: GalleryImage = {
        id: Date.now().toString(),
        url: URL.createObjectURL(files[0]),
        caption: files[0].name,
        uploadedAt: new Date().toLocaleDateString(),
        uploadedBy: "Current User",
      };

      setImages((prev) => [newImage, ...prev]);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const openImageViewer = (image: GalleryImage) => {
    setSelectedImage(image);
    setIsViewerOpen(true);
  };

  return (
    <>
      <Card className="border border-gray-200 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Project Gallery
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              id="image-upload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Add Photos"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No photos yet
              </h3>
              <p className="text-gray-600">
                Add photos to showcase project progress and milestones
              </p>
              <Button
                className="mt-4"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                Add Photos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group overflow-hidden rounded-sm border border-gray-200"
                >
                  <img
                    src={image.url}
                    alt={image.caption || "Project image"}
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white hover:bg-opacity-20"
                        onClick={() => openImageViewer(image)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white hover:bg-opacity-20"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                      <p className="text-sm truncate">{image.caption}</p>
                      <p className="text-xs text-gray-300">
                        {image.uploadedAt}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl bg-black bg-opacity-90 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Viewer</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.caption || "Project image"}
                className="w-full max-h-[70vh] object-contain"
              />
              {(selectedImage.caption || selectedImage.uploadedAt) && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded">
                  {selectedImage.caption && (
                    <p className="text-lg font-medium">
                      {selectedImage.caption}
                    </p>
                  )}
                  <p className="text-sm text-gray-300">
                    Uploaded on {selectedImage.uploadedAt} by{" "}
                    {selectedImage.uploadedBy}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
