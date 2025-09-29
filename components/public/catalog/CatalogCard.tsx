"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Design } from "@/types/design";
import { Home, Square, Heart, ArrowRight } from "lucide-react";
import Image from "next/image";

interface CatalogCardProps {
  design: Design;
  onDesignClick: (design: Design) => void;
  onInquire: (design: Design) => void;
  formatPrice: (price: number) => string;
}

export function CatalogCard({
  design,
  onDesignClick,
  onInquire,
  formatPrice,
}: CatalogCardProps) {
  return (
    <Card
      className="group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
      onClick={() => onDesignClick(design)}
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

        {/* Overlay with Inquire Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <Button
            variant="outline"
            className="bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              onInquire(design);
            }}
          >
            Inquire Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Price and Loan Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className="bg-[var(--orange)] text-white text-sm font-medium px-3 py-1">
            {formatPrice(design.price)}
          </Badge>
          {design.isLoanOffer && (
            <Badge
              variant="secondary"
              className="bg-green-600 text-white text-xs"
            >
              Loan Available
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            // Add favorite functionality here
          }}
        >
          <Heart className="h-4 w-4 text-gray-700" />
        </Button>
      </div>

      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-lg line-clamp-1">{design.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {design.description}
        </CardDescription>
      </CardHeader>

      <CardFooter className="p-6 pt-0">
        <div className="flex justify-between items-center text-sm text-gray-500 w-full">
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4 text-[var(--orange)]" />
            <span>{design.number_of_rooms} Rooms</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4 text-[var(--orange)]" />
            <span>{design.square_meters} sqm</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
