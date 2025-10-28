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
  // Handle background scroll lock and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.cssText = `position: fixed; top: -${scrollY}px; width: 100%; overflow: hidden;`;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasNext && onNext) onNext();
      else if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.cssText = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!isOpen) return null;

  const NavButton = ({
    onClick,
    direction,
    disabled = false,
  }: {
    onClick: () => void;
    direction: "left" | "right";
    disabled?: boolean;
  }) => (
    <Button
      variant="secondary"
      size="icon"
      className={`absolute ${direction === "left" ? "-left-12" : "-right-12"} z-10 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-700`}
      onClick={onClick}
      disabled={disabled}
    >
      {direction === "left" ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full mx-4 max-h-screen flex items-center justify-center">
        {/* Close Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -top-8 right-0 z-10 h-6 w-6 rounded-full bg-white/90 hover:bg-white text-gray-700"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Navigation Buttons */}
        {hasPrev && onPrev && <NavButton onClick={onPrev} direction="left" />}
        {hasNext && onNext && <NavButton onClick={onNext} direction="right" />}

        {/* Modal Content */}
        <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Item Details</h2>
            <p className="text-gray-600 text-sm mt-1">
              Complete information for {item.name}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <ItemDetailsCard item={item} />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t bg-gray-50">
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
