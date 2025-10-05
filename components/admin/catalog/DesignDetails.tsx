"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  Pencil,
  MoreHorizontal,
  X,
  Info,
  Calculator,
} from "lucide-react";
import { Design } from "@/types/design";
import { useModalStore } from "@/lib/stores";
import { deleteDesign } from "@/action/designs";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import DetailsCard from "./DetailsCard";
import QuotationCard from "./QuotationCard";

interface DesignDetailsProps {
  design: Design | null;
  onBack: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  isOpen: boolean;
}

// 🔹 Image Cache for Admin
const adminImageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const loadingImages = new Set<string>();

// 🔹 Memoized utility functions
const capitalizeWords = (str: string | undefined): string => {
  if (!str) return "Unknown";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// 🔹 Optimized Image Component
const OptimizedAdminImage = React.memo(function OptimizedAdminImage({
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
    const cached = adminImageCache.get(src);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setCurrentSrc(cached.url);
      setIsLoaded(true);
      return;
    }

    // Prevent duplicate loading
    if (loadingImages.has(src)) {
      const checkInterval = setInterval(() => {
        const cached = adminImageCache.get(src);
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
      adminImageCache.set(src, { url: src, timestamp: Date.now() });
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

OptimizedAdminImage.displayName = "OptimizedAdminImage";

export default function DesignDetails({
  design,
  onBack,
  onDelete,
  onEdit,
  isOpen,
}: DesignDetailsProps) {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState<boolean>(false);

  // Get both the state and the designIdToDelete from the store
  const { isDeleteDesignOpen, designIdToDelete, setIsDeleteDesignOpen } =
    useModalStore();

  // Carousel state
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  // 🔹 Preload images when component opens
  useEffect(() => {
    if (isOpen && design?.images) {
      design.images.forEach((image) => {
        if (!adminImageCache.has(image) && !loadingImages.has(image)) {
          loadingImages.add(image);
          const img = new Image();
          img.src = image;
          img.onload = () => {
            adminImageCache.set(image, { url: image, timestamp: Date.now() });
            loadingImages.delete(image);
          };
          img.onerror = () => {
            loadingImages.delete(image);
          };
        }
      });
    }
  }, [isOpen, design?.images]);

  // 🔹 Carousel setup with optimized event handling
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // 🔹 Memoized event handlers
  const handleConfirmDelete = useCallback(async () => {
    if (!designIdToDelete) {
      toast.error("No design selected for deletion");
      setIsDeleteDesignOpen(false);
      return;
    }

    const result = await deleteDesign(designIdToDelete);

    if (result?.success) {
      onDelete(designIdToDelete);
      toast.success("Design deleted successfully!");
      setIsDeleteDesignOpen(false);
      onBack();
    } else {
      toast.error(result?.error || "Failed to delete design");
      setIsDeleteDesignOpen(false);
    }
  }, [designIdToDelete, onDelete, onBack, setIsDeleteDesignOpen]);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  const handleDetailsOpen = useCallback(() => {
    setIsDetailsDialogOpen(true);
  }, []);

  const handleLoanOpen = useCallback(() => {
    setIsLoanDialogOpen(true);
  }, []);

  const handleEditClick = useCallback(() => {
    onEdit();
  }, [onEdit]);

  const handleDeleteClick = useCallback(() => {
    if (design) {
      setIsDeleteDesignOpen(true, design.design_id);
    }
  }, [design, setIsDeleteDesignOpen]);

  // 🔹 Memoized design data
  const memoizedDesign = useMemo(() => design, [design]);

  // 🔹 Memoized carousel items
  const carouselItems = useMemo(
    () =>
      design?.images.map((image, index) => (
        <CarouselItem key={index}>
          <Card className="border-0 shadow-none">
            <CardContent className="flex items-center justify-center">
              <OptimizedAdminImage
                src={image}
                alt={`${design.name} ${index + 1}`}
                className="w-full min-h-[500px] max-h-[680px] object-contain rounded-lg p-2 bg-gray-100"
                priority={index === 0}
              />
            </CardContent>
          </Card>
        </CarouselItem>
      )) || [],
    [design]
  );

  // 🔹 Memoized thumbnail items
  const thumbnailItems = useMemo(
    () =>
      design?.images.map((image, index) => (
        <button
          key={index}
          onClick={() => handleThumbnailClick(index)}
          className={`border-2 rounded-lg overflow-hidden transition-all duration-200 ${
            current - 1 === index
              ? "border-[var(--orange)] ring-2 ring-[var(--orange)] ring-opacity-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="w-full h-40 relative">
            <OptimizedAdminImage
              src={image}
              alt={`${design.name} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      )) || [],
    [design, current, handleThumbnailClick]
  );

  // Early return if design is null
  if (!design) {
    return null;
  }

  const memoizedDescription = useMemo(
    () => capitalizeWords(design.description),
    [design.description]
  );

  return (
    <>
      {/* Drawer for Image Display */}
      <Drawer open={isOpen} onOpenChange={onBack}>
        <DrawerContent className="h-[98vh] max-h-[98vh]">
          <DrawerTitle asChild>
            <VisuallyHidden>Design Details - {design.name}</VisuallyHidden>
          </DrawerTitle>
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {/* Header Section */}
            <div className="w-full max-w-5xl mx-auto flex items-start justify-between mb-6 relative pt-5">
              <h1 className="text-3xl font-semibold">{design.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Sticky Actions */}
            <div className="w-full max-w-6xl p-4 bg-white sticky top-[-25] z-10 mx-auto">
              <div className="flex justify-between items-center w-full max-w-5xl mx-auto">
                <Badge
                  variant="secondary"
                  className={
                    design.isLoanOffer
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {design.isLoanOffer
                    ? "Available for Loan"
                    : "Not Available for Loan"}
                </Badge>

                <div className="flex items-center gap-2">
                  {/* Project Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDetailsOpen}
                    className="flex items-center gap-2 font-medium cursor-pointer p-3 border-none shadow-none"
                  >
                    <Info className="h-4 w-4" />
                    Project Details
                  </Button>

                  {/* Loan Quotation Button */}
                  {design.isLoanOffer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoanOpen}
                      className="flex items-center gap-2 font-medium cursor-pointer p-3 border-none shadow-none"
                    >
                      <Calculator className="h-4 w-4" />
                      Check Loan Quotation
                    </Button>
                  )}

                  {/* Action Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleEditClick}
                        className="text-sm cursor-pointer"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDeleteClick}
                        className="text-sm text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Image Carousel */}
            <div className="w-full mb-6">
              <Carousel setApi={setApi} className="w-full max-w-6xl mx-auto">
                <CarouselContent>{carouselItems}</CarouselContent>
                {design.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4 size-8 bg-white/80 hover:bg-white transition-all duration-300" />
                    <CarouselNext className="right-4 size-8 bg-white/80 hover:bg-white transition-all duration-300" />
                  </>
                )}
              </Carousel>
              {design.images.length > 1 && (
                <div className="text-center text-sm text-gray-500 mt-4">
                  Image {current} of {count}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="text-center max-w-6xl mx-auto mb-8">
              <p className="text-base font-medium text-gray-700 leading-relaxed tracking-[1.2px]">
                {memoizedDescription}
              </p>
            </div>

            {/* Dynamic Image Grid for Additional Images */}
            {design.images.length > 1 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  All Images
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {thumbnailItems}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialog for Project Details */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 font-geist scroll-smooth">
          <DialogHeader className="px-6 py-4">
            <DialogTitle>
              <VisuallyHidden></VisuallyHidden>
            </DialogTitle>
          </DialogHeader>
          <DetailsCard design={design} />
        </DialogContent>
      </Dialog>

      {/* Dialog for Loan Quotation */}
      <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 font-geist scroll-smooth">
          <DialogHeader className="px-6 py-4">
            <DialogTitle>
              <VisuallyHidden></VisuallyHidden>
            </DialogTitle>
          </DialogHeader>
          <QuotationCard design={design} />
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={isDeleteDesignOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDesignOpen(false)}
        title="Delete Design"
        description="Are you sure you want to delete this design? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
