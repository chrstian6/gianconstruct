"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Design } from "@/types/design";
import { getDesigns } from "@/action/designs";
import { submitInquiry } from "@/action/inquiries";
import { Home, Square, Heart, ArrowRight, X } from "lucide-react";
import { PublicDesignDetails } from "@/components/public/catalog/PublicDesignDetails";
import Image from "next/image";
import Confetti from "react-confetti";

export default function PublicCatalog() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false); // For form submission
  const [showConfetti, setShowConfetti] = useState(false); // State to control confetti
  const [showAcknowledgment, setShowAcknowledgment] = useState(false); // State for acknowledgment dialog
  const [fetching, setFetching] = useState(true); // New state for data fetching

  useEffect(() => {
    const fetchDesigns = async () => {
      setFetching(true); // Start loading
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
        setFetching(false); // End loading
      }
    };
    fetchDesigns();
  }, []);

  const handleDesignClick = (design: Design) => {
    setSelectedDesign(design);
    setIsDetailsOpen(true);
  };

  const handleInquire = (design: Design) => {
    setSelectedDesign(design);
    setIsDetailsOpen(false);
    setIsInquiryOpen(true);
  };

  const handleSubmitInquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDesign) return;

    setIsLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("email", formData.email);
      formDataObj.append("phone", formData.phone);
      formDataObj.append("message", formData.message);
      formDataObj.append("designId", selectedDesign.design_id); // Already using design_id

      const result = await submitInquiry(formDataObj);
      if (result.success) {
        toast.success("Inquiry submitted successfully!");
        setIsInquiryOpen(false); // Close inquiry modal
        setFormData({ name: "", email: "", phone: "", message: "" });
        setShowConfetti(true); // Trigger confetti
        setShowAcknowledgment(true); // Show acknowledgment dialog
        setTimeout(() => {
          setShowConfetti(false); // Hide confetti after 5 seconds
          setShowAcknowledgment(false); // Close acknowledgment after 5 seconds
        }, 5000); // 5 seconds duration
      } else {
        toast.error(result.error || "Failed to submit inquiry");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the inquiry");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
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
      <div className="text-center mb-16">
        <h1 className="text-4xl tracking-tight font-black text-[var(--orange)] mb-4">
          Our Design Catalog
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our collection of modern home designs tailored to your
          lifestyle
        </p>
      </div>
      <hr className="border-t border-gray-200 my-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {fetching
          ? Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse"
              >
                <div className="relative aspect-[4/3] bg-gray-200">
                  {/* Skeleton for image */}
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          : designs.map((design, index) => (
              <React.Fragment key={design.design_id}>
                {" "}
                {/* Changed from _id to design_id */}
                <div
                  className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => handleDesignClick(design)}
                >
                  <div className="relative aspect-[4/3] bg-gray-50">
                    {design.images.length > 0 ? (
                      <Image
                        src={design.images[0]}
                        alt={design.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image available
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <Button
                        variant="outline"
                        className="bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInquire(design);
                        }}
                      >
                        Inquire Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-[var(--orange)] text-white text-sm font-medium px-3 py-1 rounded-full">
                        {formatPrice(design.price)}
                      </span>
                      {design.isLoanOffer && (
                        <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                          Loan Available
                        </span>
                      )}
                    </div>
                    <button
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add favorite functionality here
                      }}
                    >
                      <Heart className="h-5 w-5 text-gray-700" />
                    </button>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">
                      {design.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {design.description}
                    </p>

                    <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4 text-[var(--orange)]" />
                        <span>{design.number_of_rooms} Rooms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Square className="h-4 w-4 text-[var(--orange)]" />
                        <span>{design.square_meters} sqm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
      </div>
      {/* Design Details Modal */}
      {selectedDesign && (
        <PublicDesignDetails
          design={selectedDesign}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onInquire={handleInquire}
        />
      )}
      {/* Inquiry Form Modal */}
      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Inquire About {selectedDesign?.name}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              We'll get back to you within 24 hours
            </p>
          </DialogHeader>

          <div className="grid gap-6">
            {selectedDesign && (
              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                  {selectedDesign.images.length > 0 && (
                    <Image
                      src={selectedDesign.images[0]}
                      alt={selectedDesign.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{selectedDesign.name}</h4>
                  <p className="text-sm text-gray-600">
                    {formatPrice(selectedDesign.price)} •{" "}
                    {selectedDesign.square_meters} sqm
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+63 912 345 6789"
                />
              </div>

              <div>
                <Label htmlFor="message">Your Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us about your requirements..."
                  rows={4}
                />
              </div>

              <div className="relative">
                <Button
                  type="submit"
                  className="w-full bg-[var(--orange)] hover:bg-[var(--orange)]/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By submitting, you agree to our privacy policy and terms of
                service
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>
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
