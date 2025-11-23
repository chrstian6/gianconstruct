import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Loader2, Image as ImageIcon, Gauge } from "lucide-react";
import { Project } from "@/types/project";
import { addTimelinePhotoUpdate } from "@/action/project";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface AddTimelineUpdateModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  project: Project;
  onUpdateAdded: () => void;
}

export default function AddTimelineUpdateModal({
  isOpen,
  setIsOpen,
  project,
  onUpdateAdded,
}: AddTimelineUpdateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [showProgressOption, setShowProgressOption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPhotos([]);
    setIsSubmitting(false);
    setProgressPercentage(0);
    setShowProgressOption(false);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: File[] = [];
    let hasInvalidFile = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      if (!validTypes.includes(file.type)) {
        toast.error(
          `Invalid file type: ${file.name}. Please upload images only.`
        );
        hasInvalidFile = true;
        continue;
      }

      // Validate file size (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 50MB.`);
        hasInvalidFile = true;
        continue;
      }

      newPhotos.push(file);
    }

    if (hasInvalidFile && newPhotos.length === 0) {
      return;
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProgressToggle = () => {
    setShowProgressOption(!showProgressOption);
    if (!showProgressOption) {
      setProgressPercentage(0);
    }
  };

  const handleProgressChange = (value: number[]) => {
    setProgressPercentage(value[0]);
  };

  const getProgressLabel = (percentage: number) => {
    if (percentage === 0) return "Not Started";
    if (percentage === 100) return "Completed";
    if (percentage >= 75) return "Almost Done";
    if (percentage >= 50) return "In Progress";
    if (percentage >= 25) return "Getting Started";
    return "Just Started";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!title.trim()) {
      toast.error("Please enter a title for the update");
      return;
    }

    if (photos.length === 0) {
      toast.error("Please add at least one photo");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      // Add progress data if progress option is enabled
      if (showProgressOption) {
        formData.append("progress", progressPercentage.toString());
      }

      const result = await addTimelinePhotoUpdate(project.project_id, formData);

      if (result.success) {
        toast.success("Update added successfully!");
        onUpdateAdded();
        handleClose();
      } else {
        toast.error(result.error || "Failed to add update");
      }
    } catch (error) {
      toast.error("An error occurred while adding the update");
      console.error("Error adding timeline update:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add Timeline Update
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Add photos and details to track progress for {project.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Update Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Foundation Completed, Roof Installation, etc."
              className="w-full"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this update..."
              className="w-full min-h-[80px] resize-vertical"
              disabled={isSubmitting}
            />
          </div>

          {/* Progress Section */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Track Progress
              </Label>
              <Button
                type="button"
                variant={showProgressOption ? "default" : "outline"}
                size="sm"
                onClick={handleProgressToggle}
                disabled={isSubmitting}
                className="h-8"
              >
                {showProgressOption ? "Remove Progress" : "Add Progress"}
              </Button>
            </div>

            {showProgressOption && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Progress: {progressPercentage}%
                    </span>
                    <span className="text-xs text-gray-500">
                      {getProgressLabel(progressPercentage)}
                    </span>
                  </div>
                  <Slider
                    value={[progressPercentage]}
                    onValueChange={handleProgressChange}
                    max={100}
                    step={5}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Progress Visualization */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Photos *</Label>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary hover:bg-gray-50"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={isSubmitting}
              />

              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Drag and drop photos here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports JPG, PNG, GIF, WEBP, SVG (Max 50MB each)
              </p>
            </div>

            {/* Selected Photos Preview */}
            {photos.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Selected Photos ({photos.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg overflow-hidden"
                    >
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-700 truncate">
                          {photo.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(photo.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || photos.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Update...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Update
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
