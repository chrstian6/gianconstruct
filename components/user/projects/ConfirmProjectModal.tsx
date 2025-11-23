// components/user/projects/ConfirmProjectModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import {
  X,
  Loader2,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

interface ConfirmProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirm: (projectId: string) => void;
  isConfirming: boolean;
}

// 🔹 Image Cache for Project Images
const projectImageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const loadingImages = new Set<string>();

// 🔹 Optimized Image Component
const OptimizedProjectImage = React.memo(function OptimizedProjectImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState("");

  useEffect(() => {
    setIsLoaded(false);

    // Check cache first
    const cached = projectImageCache.get(src);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setCurrentSrc(cached.url);
      setIsLoaded(true);
      return;
    }

    // Prevent duplicate loading
    if (loadingImages.has(src)) {
      const checkInterval = setInterval(() => {
        const cached = projectImageCache.get(src);
        if (cached) {
          setCurrentSrc(cached.url);
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }

    // Mark as loading and load new image
    loadingImages.add(src);
    const img = new Image();
    img.src = src;

    img.onload = () => {
      projectImageCache.set(src, { url: src, timestamp: Date.now() });
      loadingImages.delete(src);
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      loadingImages.delete(src);
      setIsLoaded(true);
    };
  }, [src]);

  if (!isLoaded) {
    return <div className={`bg-gray-200 animate-pulse ${className}`} />;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
});

OptimizedProjectImage.displayName = "OptimizedProjectImage";

export default function ConfirmProjectModal({
  isOpen,
  onClose,
  project,
  onConfirm,
  isConfirming,
}: ConfirmProjectModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const projectImages = project?.projectImages || [];

  // 🔹 Preload images when component mounts or project changes
  useEffect(() => {
    if (projectImages.length > 0) {
      projectImages.forEach((image) => {
        if (
          !projectImageCache.has(image.url) &&
          !loadingImages.has(image.url)
        ) {
          loadingImages.add(image.url);
          const img = new Image();
          img.src = image.url;
          img.onload = () => {
            projectImageCache.set(image.url, {
              url: image.url,
              timestamp: Date.now(),
            });
            loadingImages.delete(image.url);
          };
          img.onerror = () => {
            loadingImages.delete(image.url);
          };
        }
      });
    }
  }, [projectImages]);

  const handleConfirm = () => {
    if (project) {
      onConfirm(project.project_id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const openImage = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewerOpen(true);
  };

  const closeImage = () => {
    setIsImageViewerOpen(false);
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImageIndex === null || projectImages.length === 0) return;

    if (direction === "prev") {
      setSelectedImageIndex((prev) =>
        prev === 0 ? projectImages.length - 1 : prev! - 1
      );
    } else {
      setSelectedImageIndex((prev) =>
        prev === projectImages.length - 1 ? 0 : prev! + 1
      );
    }
  };

  const handleDownload = async (imageUrl: string, imageTitle: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${imageTitle.replace(/\s+/g, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        navigateImage("prev");
      } else if (e.key === "ArrowRight") {
        navigateImage("next");
      } else if (e.key === "Escape") {
        closeImage();
      }
    },
    [navigateImage]
  );

  // 🔹 Memoized image grid items
  const imageGridItems = useMemo(
    () =>
      projectImages.map((image, index) => (
        <div
          key={index}
          className="group relative bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => openImage(index)}
        >
          <div className="aspect-video relative bg-muted overflow-hidden">
            <OptimizedProjectImage
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              priority={index < 3} // Prioritize loading first 3 images
            />
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className="bg-black/50 text-white border-0 text-xs"
              >
                {index + 1}/{projectImages.length}
              </Badge>
            </div>

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 text-black hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImage(index);
                  }}
                >
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 text-black hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image.url, image.title);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image info */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
              {image.title}
            </h3>

            {image.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {image.description}
              </p>
            )}
          </div>
        </div>
      )),
    [projectImages]
  );

  // Early return after all hooks
  if (!project) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Confirm Project Start
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground leading-relaxed">
              Please carefully review the project details and proposed images
              before confirming the project start. This action will move the
              project to active status and construction will begin according to
              the scheduled start date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {/* Proposed Project Images - Moved to Top */}
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Proposed Project Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectImages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {imageGridItems}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed border-border">
                    <div className="text-muted-foreground mb-3 text-4xl">
                      📷
                    </div>
                    <p className="text-muted-foreground text-lg font-medium mb-2">
                      No project images available
                    </p>
                    <p className="text-muted-foreground text-base">
                      Contact the project administrator for visual references
                      and design details.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Overview */}
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">
                        Project ID
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-sm font-mono px-3 py-1"
                      >
                        {project.project_id}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">
                        Project Name
                      </div>
                      <div className="text-foreground font-medium">
                        {project.name}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">
                        Location
                      </div>
                      <div className="text-foreground">
                        {project.location?.fullAddress || "Construction Site"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">
                        Start Date
                      </div>
                      <div className="text-foreground">
                        {formatDate(project.startDate)}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">
                        Completion Date
                      </div>
                      <div className="text-foreground">
                        {project.endDate
                          ? formatDate(project.endDate)
                          : "To be determined"}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-muted-foreground mb-1">
                        Total Cost
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        ₱{(project.totalCost ?? 0).toLocaleString("en-PH")}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Creation Date */}
            <Card className="border-border shadow-none">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                      Project Created
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {project.createdAt
                        ? formatDate(new Date(project.createdAt))
                        : "Date not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confirmation Notice */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 bg-blue-500 rounded-full h-auto"></div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-blue-900 text-lg mb-3">
                      Important Notice
                    </h5>
                    <div className="text-blue-800 text-base leading-relaxed space-y-2">
                      <p>
                        By confirming this project, you acknowledge that you
                        have thoroughly reviewed all project details, including
                        the proposed images, specifications, and timeline.
                      </p>
                      <p>
                        Once confirmed, the project status will change to
                        "Active" and construction activities will commence
                        according to the established schedule.
                      </p>
                      <p className="font-medium">
                        Please ensure you are satisfied with all aspects of the
                        project before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isConfirming}
              className="flex-1 sm:flex-none h-12 text-base font-medium border-2 border-border hover:border-gray-400"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel Review
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex-1 sm:flex-none h-12 bg-orange-500 hover:bg-orange-600 text-white text-base font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Confirming Project...
                </>
              ) : (
                <>Confirm Project Start</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-size Image Viewer */}
      <Dialog open={isImageViewerOpen} onOpenChange={closeImage}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-black border-none">
          {selectedImageIndex !== null && projectImages.length > 0 && (
            <div
              className="relative w-full h-full"
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {/* Navigation Arrows */}
              {projectImages.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage("prev")}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all z-10"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => navigateImage("next")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all z-10"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                onClick={closeImage}
                className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image Counter */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10">
                {selectedImageIndex + 1} / {projectImages.length}
              </div>

              {/* Action buttons */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleDownload(
                      projectImages[selectedImageIndex].url,
                      projectImages[selectedImageIndex].title
                    )
                  }
                  className="bg-black/50 text-white hover:bg-black/70 border-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Main Image */}
              <div className="flex items-center justify-center w-full h-full p-4">
                <OptimizedProjectImage
                  src={projectImages[selectedImageIndex].url}
                  alt={projectImages[selectedImageIndex].title}
                  className="max-w-full max-h-full object-contain"
                  priority={true}
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-1">
                  {projectImages[selectedImageIndex].title}
                </h3>
                {projectImages[selectedImageIndex].description && (
                  <p className="text-gray-200 text-base">
                    {projectImages[selectedImageIndex].description}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
