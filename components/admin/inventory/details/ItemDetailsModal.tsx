// components/admin/inventory/details/ItemDetailsModal.tsx
"use client";

import { IInventory } from "@/types/Inventory";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ItemDetailsCard } from "./InventoryDetailsCard";
import { useEffect } from "react";

interface ItemDetailsModalProps {
  item: IInventory;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export function ItemDetailsModal({
  item,
  isOpen,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: ItemDetailsModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current scroll position
      const scrollY = window.scrollY;

      // Add styles to prevent background scrolling
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      // Cleanup function to restore scrolling
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      } else if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        onPrev();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs.  ">
      <div className="relative max-w-4xl w-full mx-4 max-h-screen flex items-center justify-center">
        {/* Close Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -top-12 right-0 z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-700"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Navigation Buttons - if we have multiple items to navigate through */}
        {(hasNext || hasPrev) && (
          <>
            {hasPrev && onPrev && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute -left-12 z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-700"
                onClick={onPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {hasNext && onNext && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute -right-12 z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-700"
                onClick={onNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}

        {/* Modal Content */}
        <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 font-geist">
              Item Details
            </h2>
            <p className="text-gray-600 font-geist mt-1">
              Complete information for {item.name}
            </p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <ItemDetailsCard item={item} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t bg-gray-50">
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
