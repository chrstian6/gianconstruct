// components/admin/projects/details/Gallery.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Image as ImageIcon,
  Trash2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProjectGalleryImages } from "@/action/project";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import GallerySkeleton from "@/components/admin/projects/skeletons/GallerySkeleton";

interface GalleryImage {
  url: string;
  title: string;
  description?: string;
  project_id: string;
  project_name: string;
  uploadedAt: Date;
  timeline_id?: string;
}

interface GalleryProps {
  projectId: string;
}

// 🔹 Image Cache for Gallery Images
const galleryImageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const loadingGalleryImages = new Set<string>();

// 🔹 Optimized Image Component for Gallery
const OptimizedGalleryImage = React.memo(function OptimizedGalleryImage({
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
    const cached = galleryImageCache.get(src);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setCurrentSrc(cached.url);
      setIsLoaded(true);
      return;
    }

    // Prevent duplicate loading
    if (loadingGalleryImages.has(src)) {
      const checkInterval = setInterval(() => {
        const cached = galleryImageCache.get(src);
        if (cached) {
          setCurrentSrc(cached.url);
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 50);
      return () => clearInterval(checkInterval);
    }

    // Mark as loading and load new image
    loadingGalleryImages.add(src);
    const img = new Image();
    img.src = src;

    img.onload = () => {
      galleryImageCache.set(src, { url: src, timestamp: Date.now() });
      loadingGalleryImages.delete(src);
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      loadingGalleryImages.delete(src);
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

OptimizedGalleryImage.displayName = "OptimizedGalleryImage";

export default function Gallery({ projectId }: GalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // 12 images per page

  // Fetch images from timeline when component mounts
  useEffect(() => {
    fetchGalleryImages();
  }, [projectId]);

  // 🔹 Preload images when component mounts
  useEffect(() => {
    if (images.length > 0) {
      images.forEach((image) => {
        if (
          !galleryImageCache.has(image.url) &&
          !loadingGalleryImages.has(image.url)
        ) {
          loadingGalleryImages.add(image.url);
          const img = new Image();
          img.src = image.url;
          img.onload = () => {
            galleryImageCache.set(image.url, {
              url: image.url,
              timestamp: Date.now(),
            });
            loadingGalleryImages.delete(image.url);
          };
          img.onerror = () => {
            loadingGalleryImages.delete(image.url);
          };
        }
      });
    }
  }, [images]);

  const fetchGalleryImages = async () => {
    try {
      setIsLoading(true);
      const response = await getProjectGalleryImages(projectId);

      if (response.success && response.images) {
        const galleryImages: GalleryImage[] = response.images.map(
          (image: any) => ({
            url: image.url,
            title: image.title || "Timeline Image",
            description: image.description,
            project_id: image.project_id,
            project_name: image.project_name,
            uploadedAt: new Date(image.uploadedAt),
            timeline_id: image.timeline_id,
          })
        );
        setImages(galleryImages);
      } else {
        toast.error(response.error || "Failed to fetch gallery images");
        setImages([]);
      }
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      toast.error("Failed to load gallery images");
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (image: GalleryImage) => {
    // Note: Image deletion should be handled via timeline management
    toast.info("Image deletion is handled through timeline updates");
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Generate a unique key for each image
  const getImageKey = (image: GalleryImage, index: number) => {
    return image.timeline_id
      ? `${image.timeline_id}-${index}`
      : `${image.url}-${index}`;
  };

  // 🔹 Pagination logic
  const totalPages = Math.ceil(images.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImages = images.slice(startIndex, endIndex);

  // 🔹 Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of gallery when page changes
    const galleryElement = document.getElementById("gallery-content");
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're at the beginning
      if (currentPage <= 2) {
        end = 4;
      }
      // Adjust if we're at the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push("ellipsis-start");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis-end");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // 🔹 Navigation functions for modal
  const handleNextImage = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % images.length);
  }, [selectedImageIndex, images.length]);

  const handlePrevImage = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex(
      (selectedImageIndex - 1 + images.length) % images.length
    );
  }, [selectedImageIndex, images.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    },
    [handlePrevImage, handleNextImage]
  );

  // 🔹 Memoized masonry grid items for current page
  const masonryGridItems = useMemo(() => {
    // Create columns for masonry layout
    const columns: GalleryImage[][] = [[], [], []];
    currentImages.forEach((image, index) => {
      columns[index % 3].push(image);
    });

    return columns.map((column, columnIndex) => (
      <div key={columnIndex} className="flex flex-col gap-4">
        {column.map((image, imageIndex) => {
          const globalIndex = images.findIndex((img) => img.url === image.url);
          return (
            <div
              key={getImageKey(image, globalIndex)}
              className="group relative bg-transparent rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="relative bg-transparent overflow-hidden">
                <OptimizedGalleryImage
                  src={image.url}
                  alt={image.title}
                  className="w-full h-auto object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  priority={globalIndex < 6} // Prioritize loading first 6 images
                />

                {/* Hover overlay with actions and info - NO WHITE BACKGROUND */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col justify-between opacity-0 group-hover:opacity-100">
                  {/* Top actions */}
                  <div className="flex justify-between items-start p-3">
                    <Badge
                      variant="secondary"
                      className="bg-black/70 text-white border-0 text-xs backdrop-blur-sm"
                    >
                      {globalIndex + 1}/{images.length}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-black/70 text-white hover:bg-black/90 border-0 h-8 w-8 p-0 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(globalIndex);
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-black/70 text-white hover:bg-black/90 border-0 h-8 w-8 p-0 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(image);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom info - transparent background */}
                  <div className="p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    {image.title && (
                      <h3 className="font-semibold text-white text-sm font-geist line-clamp-1 mb-1 bg-transparent">
                        {image.title}
                      </h3>
                    )}
                    {image.description && (
                      <p className="text-white/80 text-xs font-geist line-clamp-2 bg-transparent">
                        {image.description}
                      </p>
                    )}
                    <p className="text-white/60 text-xs font-geist mt-1 bg-transparent">
                      {formatDate(image.uploadedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ));
  }, [currentImages, images, handleDeleteImage]);

  // 🔹 Show skeleton loader while loading
  if (isLoading) {
    return <GallerySkeleton />;
  }

  if (images.length === 0) {
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Project Gallery
          </CardTitle>
          <div className="text-sm text-gray-600">No images yet</div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No photos yet
            </h3>
            <p className="text-gray-600">
              Add photos to timeline updates to showcase project progress and
              milestones
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Project Gallery
          </CardTitle>
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, images.length)} of{" "}
            {images.length} {images.length === 1 ? "image" : "images"} from
            timeline updates
          </div>
        </CardHeader>
        <CardContent id="gallery-content">
          {/* Masonry Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {masonryGridItems}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  {/* Previous Button */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => {
                    if (page === "ellipsis-start" || page === "ellipsis-end") {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page as number);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {/* Next Button */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal with Carousel Navigation (like ProposedDesignTab) */}
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
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70 border-0"
            >
              ✕
            </Button>

            {/* Previous button */}
            {images.length > 1 && (
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
            {images.length > 1 && (
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
                {selectedImageIndex + 1} / {images.length}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDeleteImage(images[selectedImageIndex])}
                className="bg-black/50 text-white hover:bg-black/70 border-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Image display - no zoom effect */}
            <div className="flex items-center justify-center h-full cursor-default">
              <OptimizedGalleryImage
                src={images[selectedImageIndex].url}
                alt={images[selectedImageIndex].title}
                className="max-w-full max-h-full object-contain"
                priority={true}
              />
            </div>

            {/* Image info in modal */}
            <div className="absolute bottom-4 left-4 z-10 max-w-md">
              <h3 className="font-semibold text-white font-geist text-sm">
                {images[selectedImageIndex].title}
              </h3>
              {images[selectedImageIndex].description && (
                <p className="text-white/80 font-geist text-xs mt-1">
                  {images[selectedImageIndex].description}
                </p>
              )}
              <p className="text-white/60 font-geist text-xs mt-1">
                Uploaded on {formatDate(images[selectedImageIndex].uploadedAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
