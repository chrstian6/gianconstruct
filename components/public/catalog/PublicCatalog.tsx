"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { X, Search, Filter, ArrowRight } from "lucide-react";

// Define props interface
interface PublicCatalogProps {
  searchTerm?: string;
}

export default function PublicCatalog({ searchTerm = "" }: PublicCatalogProps) {
  // --- State ---
  const [designs, setDesigns] = useState<Design[]>([]);

  // Search State: Initialize with prop, but allow local editing via the new search bar
  const [searchQuery, setSearchQuery] = useState<string>(searchTerm);

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

  // Sync prop with local state if parent updates it
  useEffect(() => {
    setSearchQuery(searchTerm);
  }, [searchTerm]);

  // Available categories
  const categories = useMemo(
    () => [
      "all",
      "industrial",
      "residential",
      "commercial",
      "office",
      "custom",
    ],
    []
  );

  // --- Initial Fetch ---
  useEffect(() => {
    const fetchDesigns = async () => {
      setFetching(true);
      try {
        const result = await getDesigns();
        if (result.success && result.designs) {
          setDesigns(result.designs);
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

  // --- Search Logic (Memoized) ---
  const getFilteredDesigns = useCallback(
    (currentDesigns: Design[], query: string, category: string) => {
      let filtered = currentDesigns;

      // 1. Apply Category Filter
      if (category !== "all") {
        filtered = filtered.filter((design) => design.category === category);
      }

      // 2. Apply Search Filter
      if (!query.trim()) return filtered;

      const searchLower = query.toLowerCase().trim();
      const searchWords = searchLower
        .split(/\s+/)
        .filter((word) => word.length > 0);

      return filtered.filter((design) => {
        const searchableText = `
        ${design.name?.toLowerCase() || ""}
        ${design.category?.toLowerCase() || ""}
        ${design.description?.toLowerCase() || ""}
      `;

        const matchesAllWords = searchWords.every((word) =>
          searchableText.includes(word)
        );

        if (!matchesAllWords && searchWords.length === 1) {
          const singleWord = searchWords[0];
          const searchMappings: { [key: string]: string[] } = {
            ho: ["house", "home", "housing"],
            kit: ["kitchen"],
            bed: ["bedroom"],
            bath: ["bathroom"],
            liv: ["living", "living room"],
            off: ["office"],
            com: ["commercial"],
            res: ["residential"],
            ind: ["industrial"],
            cus: ["custom"],
          };

          const mappedTerms = searchMappings[singleWord] || [];
          return mappedTerms.some((term) => searchableText.includes(term));
        }

        return matchesAllWords;
      });
    },
    []
  );

  // Derived state for filtered designs (Uses searchQuery instead of just prop)
  const filteredDesigns = useMemo(() => {
    return getFilteredDesigns(designs, searchQuery, filterCategory);
  }, [designs, searchQuery, filterCategory, getFilteredDesigns]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, searchQuery]);

  // --- Pagination Logic ---
  const totalCount = filteredDesigns.length;
  const totalPages = Math.ceil(totalCount / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentDesigns = filteredDesigns.slice(startIndex, endIndex);

  // --- Helpers ---
  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

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

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showConfetti && (
          <Confetti
            width={typeof window !== "undefined" ? window.innerWidth : 1000}
            height={typeof window !== "undefined" ? window.innerHeight : 1000}
            numberOfPieces={100}
            gravity={0.1}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              pointerEvents: "none",
              zIndex: 50,
            }}
          />
        )}

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-orange-500 flex items-center gap-3">
              Design Catalog
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              Explore our curated collection of architectural masterpieces.
            </p>
          </div>

          {/* Result Count Badge */}
          {!fetching && (
            <div className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
              Showing{" "}
              <span className="text-orange-600 font-bold">
                {filteredDesigns.length}
              </span>{" "}
              results
            </div>
          )}
        </div>

        {/* --- MODERN SEARCH BAR --- */}
        <div className="relative max-w-2xl mx-auto mb-10 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-12 py-4 bg-white border border-gray-200 rounded-full text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300 ease-in-out hover:shadow-md"
            placeholder="Search by name, category, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <div className="bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </div>
            </button>
          )}
        </div>

        {/* --- Category Filters --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1">
              <Filter className="h-4 w-4" /> Filters:
            </span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    filterCategory === category
                      ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50"
                  }
                `}
              >
                {category === "all" ? "All" : capitalizeFirstLetter(category)}
              </button>
            ))}
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        {fetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-4 animate-pulse">
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 h-full">
                  <div className="relative aspect-[4/3] bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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

            {/* --- Pagination (Transparent Background) --- */}
            <div className="mt-16 mb-8 flex justify-center">
              <Pagination className="flex justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={`hover:bg-orange-50 hover:text-orange-600 transition-colors border-0 bg-transparent shadow-none ${
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }`}
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
                          className={`
                            cursor-pointer transition-all duration-200 rounded-full w-9 h-9 border-0 shadow-none
                            ${
                              currentPage === page
                                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md !shadow-orange-200"
                                : "bg-transparent text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                            }
                          `}
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
                      className={`hover:bg-orange-50 hover:text-orange-600 transition-colors border-0 bg-transparent shadow-none ${
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="py-20 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center mx-auto max-w-3xl mt-8">
            <NotFound
              title={
                searchQuery.trim()
                  ? `No designs found for "${searchQuery}"`
                  : "No designs found"
              }
              description={
                searchQuery.trim()
                  ? "We couldn't find exactly what you're looking for. Try adjusting your search terms."
                  : "Try selecting a different category to explore more designs."
              }
            />
            <div className="flex gap-4 justify-center mt-8">
              <Button
                variant="outline"
                onClick={() => setFilterCategory("all")}
                className="border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                View All Categories
              </Button>
              {searchQuery.trim() && (
                <Button
                  variant="default"
                  onClick={() => setSearchQuery("")}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        )}

        {/* --- Modals & Overlays --- */}
        {selectedDesign && (
          <PublicDesignDetails
            design={selectedDesign}
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            onInquire={handleInquire}
          />
        )}

        <InquiryForm
          selectedDesign={selectedDesign}
          isInquiryOpen={isInquiryOpen}
          setIsInquiryOpen={setIsInquiryOpen}
          onInquirySuccess={handleInquirySuccess}
        />

        <Dialog open={showAcknowledgment} onOpenChange={setShowAcknowledgment}>
          <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-center text-white relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
              <DialogTitle className="text-3xl font-bold relative z-10">
                Thank You!
              </DialogTitle>
              <p className="text-orange-50 mt-2 relative z-10">
                Inquiry Submitted Successfully
              </p>
              <button
                onClick={() => setShowAcknowledgment(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-8 text-center space-y-6 bg-white">
              <div className="space-y-2">
                <p className="text-gray-600">
                  Your inquiry for{" "}
                  <span className="font-bold text-gray-900">
                    {selectedDesign?.name}
                  </span>{" "}
                  has been received.
                </p>
                <p className="text-gray-600">
                  Our team will contact you within{" "}
                  <span className="font-semibold text-orange-600">
                    24 hours
                  </span>
                  .
                </p>
              </div>
              <Button
                onClick={() => setShowAcknowledgment(false)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                Continue Browsing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
