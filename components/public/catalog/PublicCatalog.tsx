"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Design } from "@/types/design";
import { getDesigns } from "@/action/designs";
import { PublicDesignDetails } from "@/components/public/catalog/PublicDesignDetails";
import { CatalogCard } from "@/components/public/catalog/CatalogCard";
import { InquiryForm } from "@/components/public/catalog/InquiryForm";
import Confetti from "react-confetti";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import NotFound from "@/components/admin/NotFound";
import { X } from "lucide-react";

export default function PublicCatalog() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Filter and pagination state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const cardsPerPage = 12;

  // Available categories for tags
  const categories = [
    "all",
    "industrial",
    "residential",
    "commercial",
    "office",
    "custom",
  ];

  useEffect(() => {
    const fetchDesigns = async () => {
      setFetching(true);
      try {
        const result = await getDesigns();
        if (result.success && result.designs) {
          setDesigns(result.designs);
          setFilteredDesigns(result.designs);
        } else {
          toast.error(result.error || "Failed to load designs");
        }
      } catch (error) {
        toast.error("An error occurred while loading designs");
      } finally {
        setFetching(false);
      }
    };
    fetchDesigns();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    let filtered = designs;

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(
        (design) => design.category === filterCategory
      );
    }

    setFilteredDesigns(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [designs, filterCategory]);

  // Calculate pagination
  const totalCount = filteredDesigns.length;
  const totalPages = Math.ceil(totalCount / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentDesigns = filteredDesigns.slice(startIndex, endIndex);

  const handleDesignClick = (design: Design) => {
    setSelectedDesign(design);
    setIsDetailsOpen(true);
  };

  const handleInquire = (design: Design) => {
    setSelectedDesign(design);
    setIsDetailsOpen(false);
    setIsInquiryOpen(true);
  };

  const handleInquirySuccess = () => {
    setShowConfetti(true);
    setShowAcknowledgment(true);
    setTimeout(() => {
      setShowConfetti(false);
      setShowAcknowledgment(false);
    }, 5000);
  };

  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-12 pt-16">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={100}
          gravity={0.1}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl tracking-tight font-black text-[var(--orange)] mb-4">
          Our Design Catalog
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our collection of modern home designs tailored to your
          lifestyle
        </p>
      </div>

      {/* Category Tags Only - UPDATED WITH ORANGE COLORS */}
      <div className="flex flex-wrap gap-2 mb-2 border-t py-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setFilterCategory(category);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
              filterCategory === category
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category === "all"
              ? "All Categories"
              : capitalizeFirstLetter(category)}
          </button>
        ))}
      </div>

      {/* Designs Grid */}
      {fetching ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3 animate-pulse">
              {/* Image Skeleton */}
              <div className="bg-white rounded-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative">
                <div className="relative aspect-video bg-gray-200"></div>
              </div>

              {/* Info Skeleton */}
              <div className="rounded-none">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : currentDesigns.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {currentDesigns.map((design) => (
              <CatalogCard
                key={design.design_id}
                design={design}
                onDesignClick={handleDesignClick}
                onInquire={handleInquire}
                formatPrice={formatPrice}
              />
            ))}
          </div>

          {/* Pagination Section - ALWAYS VISIBLE even with 1 page */}
          <div className="mt-12 mb-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => setCurrentPage(page as number)}
                        isActive={currentPage === page}
                        className={
                          currentPage === page
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {/* Page info */}
            <div className="text-center mt-4 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </>
      ) : (
        /* No Results State - Using NotFound Component */
        <div className="text-center py-16">
          <NotFound description="Try selecting a different category to explore more designs" />
          <Button
            variant="outline"
            onClick={() => setFilterCategory("all")}
            className="border-gray-300 mt-6"
          >
            Show All Categories
          </Button>
        </div>
      )}

      {/* Design Details Modal */}
      {selectedDesign && (
        <PublicDesignDetails
          design={selectedDesign}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onInquire={handleInquire}
        />
      )}

      {/* Inquiry Form Component */}
      <InquiryForm
        selectedDesign={selectedDesign}
        isInquiryOpen={isInquiryOpen}
        setIsInquiryOpen={setIsInquiryOpen}
        onInquirySuccess={handleInquirySuccess}
      />

      {/* Acknowledgment Dialog */}
      <Dialog open={showAcknowledgment} onOpenChange={setShowAcknowledgment}>
        <DialogContent className="sm:max-w-md rounded-xl p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-gray-900">
              Thank You!
            </DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-6">
            <p className="text-lg text-gray-700">
              Your inquiry for{" "}
              <span className="font-semibold text-[var(--orange)]">
                {selectedDesign?.name}
              </span>{" "}
              has been successfully submitted.
            </p>
            <p className="text-lg text-gray-700">
              We'll get back to you within{" "}
              <span className="font-semibold">24 hours</span>.
            </p>
            <p className="text-sm text-gray-600">
              Price:{" "}
              {selectedDesign?.price
                ? formatPrice(selectedDesign.price)
                : "N/A"}{" "}
              • Area:{" "}
              {selectedDesign?.square_meters
                ? `${selectedDesign.square_meters} sqm`
                : "N/A"}
            </p>
          </div>

          <div className="absolute right-4 top-4">
            <button
              onClick={() => setShowAcknowledgment(false)}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--orange)] focus:ring-offset-2"
            >
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
