import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Design } from "@/types/design";
import { formatCurrency } from "@/lib/amortization";

interface DetailsCardProps {
  design: Design;
}

const capitalizeWords = (str: string | undefined): string => {
  if (!str) return "Unknown";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatSquareMeters = (square_meters: number): string => {
  return `${square_meters.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqm`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function DetailsCard({ design }: DetailsCardProps) {
  return (
    <div className="pb-10 px-10 space-y-8 border-none">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="mb-10 p-0 m-0">
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Project Details
          </h1>
          <p className="text-sm text-gray-500">
            Posted {design.createdAt ? formatDate(design.createdAt) : "N/A"}
          </p>
        </div>
        {/* Price Section below Posted */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="text-2xl font-bold text-foreground tracking-relaxed">
            {formatCurrency(design.price)}
          </p>
        </div>
      </div>

      {/* 3 Cards Grid (excluding price) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Category Card */}
        <Card className="p-3 min-h-[120px] flex items-center justify-center rounded-sm">
          <CardContent className="p-0 text-center w-full">
            <p className="text-xs text-muted-50 mb-3 font-medium">Category</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight break-words px-2">
              {capitalizeWords(design.category)}
            </p>
          </CardContent>
        </Card>

        {/* Area Card */}
        <Card className="p-3 min-h-[120px] flex items-center justify-center rounded-sm">
          <CardContent className="p-0 text-center w-full">
            <p className="text-sm text-gray-600 mb-3 font-medium">Area</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight break-words px-2">
              {formatSquareMeters(design.square_meters)}
            </p>
          </CardContent>
        </Card>

        {/* Downpayment Card - REPLACED Rooms Card */}
        <Card className="p-5 min-h-[120px] flex items-center justify-center rounded-sm">
          <CardContent className="p-0 text-center w-full">
            <p className="text-xs text-gray-600 mb-3 font-medium">
              Estimated Downpayment
            </p>
            <p className="text-lg font-bold text-gray-900 leading-tight">
              {formatCurrency(design.estimated_downpayment)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
