// app/catalog/page.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import PublicCatalog from "@/components/public/catalog/PublicCatalog";
import LoginModal from "@/components/public/LoginModal";
import SignUpModal from "@/components/public/SignUpModal";
import { Navbar } from "@/components/public/Navbar";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  Home,
  Building,
  Hammer,
  Wrench,
  ClipboardCheck,
  Banknote,
  CreditCard,
} from "lucide-react";

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Services offered data
  const services = [
    {
      id: 1,
      title: "Building Plan and Permits Processing",
    },
    {
      id: 2,
      title: "General Construction",
    },
    {
      id: 3,
      title: "House Construction",
    },
    {
      id: 4,
      title: "Renovation",
    },
    {
      id: 5,
      title: "Commercial Building Construction",
    },
    {
      id: 6,
      title: "Roofing Installations",
    },
    {
      id: 7,
      title: "LOAN ASSISTANCE",
    },
    {
      id: 8,
      title: "BUILD NOW PAY LATER",
      highlight: true,
    },
  ];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }, []);

  return (
    <>
      {/* Sticky Navbar */}
      <div className="sticky top-0 z-50 bg-white">
        <Navbar />
      </div>

      <main className="w-full">
        {/* Title Section - NOT STICKY */}
        <div className="w-full text-center mb-4">
          <h1 className="text-4xl font-bold text-orange-500 mt-10 tracking-[tight] pt-6">
            Explore our Design Catalog
          </h1>
          <p className="text-gray-600 mt-1 tracking-[1.1]">
            Browse through our collection of modern and innovative home designs
          </p>
        </div>

        {/* Sticky Search Input with Services Below */}
        <div className="sticky top-12 z-40 bg-white pb-2 border-b">
          <div className="w-full pb-2">
            <div className="relative w-full max-w-2xl mx-auto">
              <Input
                type="text"
                placeholder="Search designs by name, category, or description..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pr-20 py-6 text-lg border-orange-500 focus:border-orange-500 focus:ring-orange-500"
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors cursor-pointer">
                  <Search className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Services as inline text below search input - FULL WIDTH */}
          <div className="w-full mt-2 px-4 border-t pt-2">
            <div className="flex flex-wrap justify-center gap-3 w-full">
              {services.map((service) => (
                <span
                  key={service.id}
                  className={`text-xs font-medium cursor-pointer hover:text-orange-500 transition-colors whitespace-nowrap ${
                    service.highlight
                      ? "text-orange-500 font-bold"
                      : "text-gray-600"
                  }`}
                >
                  {service.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Public Catalog with search prop */}
        <div className="container mx-auto px-10 mt-2">
          <PublicCatalog searchTerm={debouncedSearchTerm} />
        </div>

        {/* Add the modal components here */}
        <LoginModal />
        <SignUpModal />
      </main>
    </>
  );
}
