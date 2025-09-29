"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Design } from "@/types/design";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface AdminCatalogCardProps {
  design: Design;
  onEdit: (design: Design) => void;
  onDelete: (id: string) => void;
  onSelect: (design: Design) => void;
  formatPrice: (price: number) => string;
  formatSquareMeters: (square_meters: number) => string;
  capitalizeFirstLetter: (str: string) => string;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export default function AdminCatalogCard({
  design,
  onEdit,
  onDelete,
  onSelect,
  formatPrice,
  formatSquareMeters,
  capitalizeFirstLetter,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}: AdminCatalogCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // If in select mode, prevent navigation and handle selection
    if (isSelectMode) {
      e.preventDefault();
      onSelect(design);
    } else {
      onSelect(design);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

  return (
    <div className="space-y-3">
      {/* Image Section - Separate Card */}
      <div
        className={cn(
          "bg-white rounded-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative",
          isSelectMode && "border-gray-300",
          isSelected && "border-blue-500 ring-2 ring-blue-200"
        )}
        onClick={handleCardClick}
      >
        {/* Checkbox for multi-select mode */}
        {isSelectMode && (
          <div
            className="absolute top-3 left-3 z-10"
            onClick={handleCheckboxClick}
          >
            <Checkbox
              checked={isSelected}
              className={cn(
                "h-5 w-5 rounded border-2",
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300"
              )}
            />
          </div>
        )}

        <div className="relative">
          {design.images.length > 0 ? (
            <div className="relative aspect-video bg-gray-100">
              <img
                src={design.images[0]}
                alt={design.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {design.isLoanOffer && (
            <span className="absolute top-3 left-3 bg-gray-700/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
              ₱
            </span>
          )}
        </div>
      </div>

      {/* Info Section - Separate from image */}
      <div className="rounded-none">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0 pb-4">
            <h3 className="font-bold text-gray-900 text-sm text-base truncate font-geist">
              {formatPrice(design.price)}
            </h3>
            <p className="text-gray-600 text-sm font-medium font-geist">
              {capitalizeFirstLetter(design.name)}
            </p>
          </div>
          {/* Dropdown Menu - Only show when not in select mode */}
          {!isSelectMode && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 bg-white shadow-lg rounded-lg border border-gray-200"
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(design);
                  }}
                  className="text-sm cursor-pointer text-gray-700 hover:bg-gray-100"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(design.design_id);
                  }}
                  className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
