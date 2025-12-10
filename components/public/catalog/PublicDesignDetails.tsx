"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator, X, Calendar } from "lucide-react";
import { Design } from "@/types/design";
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
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import DetailsCard from "@/components/admin/catalog/DetailsCard";
import QuotationCard from "@/components/admin/catalog/QuotationCard";
import { AppointmentsSheet } from "@/components/user/AppointmentsSheet";
import { useAuthStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

// 🔹 Simple and Fast Supabase Image Cache
const supabaseImageCache = new Map<
  string,
  { url: string; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Track loading images to prevent duplicates
const loadingImages = new Set<string>();

// Simple cache cleanup
const cleanupCache = () => {
  const now = Date.now();
  supabaseImageCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_DURATION) {
      supabaseImageCache.delete(key);
    }
  });
};

// 🔹 Optimized Image Component with simple caching
const OptimizedImage = React.memo(function OptimizedImage({
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
    // Reset states when src changes
    setIsLoaded(false);

    // Check cache first
    cleanupCache();
    const cached = supabaseImageCache.get(src);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      setCurrentSrc(cached.url);
      setIsLoaded(true);
      return;
    }

    // Prevent duplicate loading
    if (loadingImages.has(src)) {
      // If already loading, wait for it
      const checkInterval = setInterval(() => {
        const cached = supabaseImageCache.get(src);
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
      // Cache the image
      supabaseImageCache.set(src, { url: src, timestamp: Date.now() });
      loadingImages.delete(src);
      setCurrentSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      loadingImages.delete(src);
      setIsLoaded(true); // Still set loaded to show error state
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

// Display name for better debugging
OptimizedImage.displayName = "OptimizedImage";

interface PublicDesignDetailsProps {
  design: Design;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInquire: (design: Design) => void;
}

export function PublicDesignDetails({
  design,
  open,
  onOpenChange,
  onInquire,
}: PublicDesignDetailsProps) {
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState<boolean>(false);
  const [isAppointmentsSheetOpen, setIsAppointmentsSheetOpen] =
    useState<boolean>(false);

  // Carousel state
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Track already preloaded images to prevent duplicates
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  // Get user from auth store
  const { user } = useAuthStore();

  // 🔹 Check if user is logged in
  const isLoggedIn = useMemo(() => {
    return !!user && !!user.user_id;
  }, [user]);

  // 🔹 Fast preload without complex logic
  useEffect(() => {
    if (open && design?.images) {
      design.images.forEach((image) => {
        // Skip if already preloaded or cached
        if (
          preloadedImagesRef.current.has(image) ||
          supabaseImageCache.has(image)
        ) {
          return;
        }

        // Mark as preloaded immediately
        preloadedImagesRef.current.add(image);

        // Only preload if not in cache
        if (!supabaseImageCache.has(image) && !loadingImages.has(image)) {
          loadingImages.add(image);
          const img = new Image();
          img.src = image;
          img.onload = () => {
            supabaseImageCache.set(image, {
              url: image,
              timestamp: Date.now(),
            });
            loadingImages.delete(image);
          };
          img.onerror = () => {
            loadingImages.delete(image);
            preloadedImagesRef.current.delete(image); // Allow retry
          };
        }
      });
    }
  }, [open, design?.images]);

  // Cleanup preloaded images when component unmounts
  useEffect(() => {
    return () => {
      preloadedImagesRef.current.clear();
    };
  }, []);

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

  // 🔹 Smooth scroll to top when opening
  useEffect(() => {
    if (open && carouselRef.current) {
      // Use setTimeout to ensure smooth scroll works after render
      setTimeout(() => {
        carouselRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [open]);

  // 🔹 Memoized event handlers
  const handleThumbnailClick = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  const handleInquireClick = useCallback(() => {
    if (isLoggedIn) {
      // If logged in, open the appointments sheet
      setIsAppointmentsSheetOpen(true);
    } else {
      // If not logged in, use the original inquiry flow
      onInquire(design);
    }
  }, [isLoggedIn, onInquire, design]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // 🔹 Memoized data
  const memoizedDesign = useMemo(
    () => design,
    [
      design.design_id,
      design.name,
      design.description,
      design.price,
      design.estimated_downpayment,
      design.square_meters,
      design.category,
      design.isLoanOffer,
    ]
  );

  const memoizedImages = useMemo(() => design.images, [design.images]);

  // 🔹 Memoized carousel items to prevent re-renders
  const carouselItems = useMemo(
    () =>
      memoizedImages.map((image, index) => (
        <CarouselItem key={`${design.design_id}-${index}`}>
          <Card className="border-0 shadow-none">
            <CardContent className="flex items-center justify-center p-0">
              <div className="w-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px] max-h-[90vh] flex items-center justify-center bg-gray-100 rounded-lg">
                <OptimizedImage
                  src={image}
                  alt={`${design.name} ${index + 1}`}
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                  priority={index === 0}
                />
              </div>
            </CardContent>
          </Card>
        </CarouselItem>
      )),
    [memoizedImages, design.design_id, design.name]
  );

  // 🔹 Memoized thumbnail items
  const thumbnailItems = useMemo(
    () =>
      memoizedImages.map((image, index) => (
        <button
          key={`thumb-${design.design_id}-${index}`}
          onClick={() => handleThumbnailClick(index)}
          className={cn(
            "border-2 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
            current === index
              ? "border-primary ring-2 ring-primary/50"
              : "border-gray-200 hover:border-gray-300"
          )}
        >
          <div className="w-full h-24 sm:h-32 md:h-40 relative">
            <OptimizedImage
              src={image}
              alt={`${design.name} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      )),
    [
      memoizedImages,
      design.design_id,
      design.name,
      current,
      handleThumbnailClick,
    ]
  );

  const capitalizeWords = useCallback((str: string | undefined): string => {
    if (!str) return "Unknown";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }, []);

  const memoizedDescription = useMemo(
    () => capitalizeWords(design.description),
    [design.description, capitalizeWords]
  );

  return (
    <>
      {/* Drawer */}
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="h-[95vh] sm:h-[98vh] max-h-[95vh] sm:max-h-[98vh]"
          ref={carouselRef}
        >
          <DrawerTitle asChild>
            <VisuallyHidden>Design Details - {design.name}</VisuallyHidden>
          </DrawerTitle>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
            {/* Header */}
            <div className="w-full max-w-6xl mx-auto flex items-start justify-between mb-4 sm:mb-6 relative pt-3 sm:pt-5">
              <div className="flex-1 min-w-0 mr-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold truncate">
                  {design.name}
                </h1>
                <div className="md:hidden mt-1">
                  <Badge
                    variant="secondary"
                    className={
                      design.isLoanOffer
                        ? "bg-green-100 text-green-800 hover:bg-green-200 text-xs"
                        : "bg-gray-100 text-gray-800 text-xs"
                    }
                  >
                    {design.isLoanOffer
                      ? "Available for Loan"
                      : "Not Available for Loan"}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Sticky Actions - Desktop */}
            <div className="hidden md:block w-full max-w-6xl p-3 sm:p-4 bg-white/95 backdrop-blur-sm sticky top-0 z-10 mx-auto border-b">
              <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-5xl mx-auto gap-3">
                <div className="w-full sm:w-auto">
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
                </div>

                <div className="flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailsDialogOpen(true)}
                    className="flex items-center gap-2 font-medium cursor-pointer px-3 py-2 border-gray-300 text-xs sm:text-sm"
                  >
                    <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Project</span>
                    <span className="sm:hidden">Details</span>
                  </Button>

                  {design.isLoanOffer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLoanDialogOpen(true)}
                      className="flex items-center gap-2 font-medium cursor-pointer px-3 py-2 border-gray-300 text-xs sm:text-sm"
                    >
                      <Calculator className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Loan</span>
                      <span className="sm:hidden">Quotation</span>
                    </Button>
                  )}

                  <Button
                    onClick={handleInquireClick}
                    className="bg-primary hover:bg-primary/90 text-white px-3 py-2 text-xs sm:text-sm"
                  >
                    {isLoggedIn ? (
                      <>
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Book</span>
                        <span className="sm:hidden">Book Now</span>
                      </>
                    ) : (
                      "Inquire Now"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Floating Action Buttons */}
            <div className="fixed bottom-4 right-4 z-20 flex flex-col gap-2 md:hidden">
              {design.isLoanOffer && (
                <Button
                  size="icon"
                  onClick={() => setIsLoanDialogOpen(true)}
                  className="h-10 w-10 rounded-full shadow-lg bg-blue-500 hover:bg-blue-600"
                  title="Loan Quotation"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                onClick={() => setIsDetailsDialogOpen(true)}
                className="h-10 w-10 rounded-full shadow-lg bg-gray-700 hover:bg-gray-800"
                title="Project Details"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={handleInquireClick}
                className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                title={isLoggedIn ? "Book Appointment" : "Inquire Now"}
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </div>

            {/* Carousel */}
            <div className="w-full mb-4 sm:mb-6 mt-2">
              <Carousel
                setApi={setApi}
                className="w-full max-w-6xl mx-auto"
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent>{carouselItems}</CarouselContent>
                {memoizedImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2 sm:left-4 size-6 sm:size-8 bg-white/80 hover:bg-white transition-all duration-300" />
                    <CarouselNext className="right-2 sm:right-4 size-6 sm:size-8 bg-white/80 hover:bg-white transition-all duration-300" />
                  </>
                )}
              </Carousel>
              {memoizedImages.length > 1 && (
                <div className="text-center text-xs sm:text-sm text-gray-500 mt-2 sm:mt-4">
                  Image {current + 1} of {count}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="text-center max-w-6xl mx-auto mb-6 sm:mb-8">
              <p className="text-sm sm:text-base font-medium text-gray-700 leading-relaxed tracking-[0.5px] sm:tracking-[1.2px] px-2 sm:px-0">
                {memoizedDescription}
              </p>
            </div>

            {/* Mobile Inquire Button */}
            <div className="md:hidden mb-6 px-4">
              <Button
                onClick={handleInquireClick}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-base font-medium"
              >
                {isLoggedIn ? (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </>
                ) : (
                  "Inquire Now"
                )}
              </Button>
            </div>

            {/* Thumbnails */}
            {memoizedImages.length > 1 && (
              <div className="mt-6 sm:mt-8 px-2 sm:px-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  All Images
                </h3>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {thumbnailItems}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Dialogs - Responsive */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 scroll-smooth">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              <VisuallyHidden>Project Details</VisuallyHidden>
            </DialogTitle>
          </DialogHeader>
          <div className="px-2 sm:px-0">
            <DetailsCard design={memoizedDesign} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 scroll-smooth">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              <VisuallyHidden>Quotation</VisuallyHidden>
            </DialogTitle>
          </DialogHeader>
          <div className="px-2 sm:px-0">
            <QuotationCard design={memoizedDesign} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointments Sheet for logged-in users */}
      <AppointmentsSheet
        open={isAppointmentsSheetOpen}
        onOpenChange={setIsAppointmentsSheetOpen}
      />
    </>
  );
}
