"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import {
  Image as ImageIcon,
  Download,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface ProposedDesignTabProps {
  project: Project;
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

export default function ProposedDesignTab({ project }: ProposedDesignTabProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isZoomed, setIsZoomed] = useState(false);

  const projectImages = project.projectImages || [];

  // 🔹 Preload images when component mounts
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
      toast.success(`Downloaded ${imageTitle}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Safe date formatting function
  const getProjectCreationDate = useCallback(() => {
    if (!project.createdAt) {
      return "Date not available";
    }
    try {
      return formatDate(new Date(project.createdAt));
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  }, [project.createdAt]);

  const handleNextImage = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % projectImages.length);
  }, [selectedImageIndex, projectImages.length]);

  const handlePrevImage = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex(
      (selectedImageIndex - 1 + projectImages.length) % projectImages.length
    );
  }, [selectedImageIndex, projectImages.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        setSelectedImageIndex(null);
        setIsZoomed(false);
      }
    },
    [handlePrevImage, handleNextImage]
  );

  // 🔹 Memoized image grid items
  const imageGridItems = useMemo(
    () =>
      projectImages.map((image, index) => (
        <div
          key={index}
          className="group relative bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="aspect-video relative bg-muted overflow-hidden">
            <OptimizedProjectImage
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
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
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 text-black hover:bg-white"
                  onClick={() => handleDownload(image.url, image.title)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image info */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-2 font-geist line-clamp-1">
              {image.title}
            </h3>

            {image.description && (
              <p className="text-sm text-muted-foreground mb-3 font-geist line-clamp-2">
                {image.description}
              </p>
            )}
          </div>
        </div>
      )),
    [projectImages]
  );

  if (projectImages.length === 0) {
    return (
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-geist">
            Proposed Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2 font-geist">
              No Design Images
            </h3>
            <p className="text-muted-foreground max-w-md font-geist">
              No proposed design images have been uploaded for this project yet.
              Design images are added during project creation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Grid */}
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-geist">
            Proposed Design Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imageGridItems}
          </div>
        </CardContent>
      </Card>

      {/* Simple Project Creation Date */}
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground font-geist">
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
                {getProjectCreationDate()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal with Carousel Navigation */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-6xl max-h-full w-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedImageIndex(null);
                setIsZoomed(false);
              }}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70 border-0"
            >
              ✕
            </Button>

            {/* Previous button */}
            {projectImages.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevImage}
                className="absolute left-4 z-10 bg-black/50 text-white hover:bg-black/70 border-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {/* Next button */}
            {projectImages.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextImage}
                className="absolute right-4 z-10 bg-black/50 text-white hover:bg-black/70 border-0"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Image counter */}
            <div className="absolute top-4 left-4 z-10">
              <Badge
                variant="secondary"
                className="bg-black/50 text-white border-0"
              >
                {selectedImageIndex + 1} / {projectImages.length}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsZoomed(!isZoomed)}
                className="bg-black/50 text-white hover:bg-black/70 border-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
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

            {/* Image display */}
            <div
              className={`flex items-center justify-center h-full ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <OptimizedProjectImage
                src={projectImages[selectedImageIndex].url}
                alt={projectImages[selectedImageIndex].title}
                className={`${isZoomed ? "w-auto h-auto max-w-none max-h-none" : "max-w-full max-h-full object-contain"} transition-all duration-300`}
                priority={true}
              />
            </div>

            {/* Image info in modal */}
            <div className="absolute bottom-4 left-4 z-10 max-w-md">
              <h3 className="font-semibold text-white font-geist text-sm">
                {projectImages[selectedImageIndex].title}
              </h3>
              {projectImages[selectedImageIndex].description && (
                <p className="text-white/80 font-geist text-xs mt-1">
                  {projectImages[selectedImageIndex].description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
