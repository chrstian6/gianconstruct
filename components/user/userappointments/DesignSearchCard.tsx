import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Design } from "@/types/design";
import { Home, MapPin, AlertCircle } from "lucide-react";
import Image from "next/image";

interface DesignSearchCardProps {
  design: Design;
  onSelect: (design: Design) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function DesignSearchCard({
  design,
  onSelect,
  disabled = false,
  disabledReason = "",
}: DesignSearchCardProps) {
  return (
    <Card
      className={`mb-3 transition-all duration-300 border border-gray-200 rounded-lg ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-md cursor-pointer"
      }`}
    >
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Image Container */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {design.images && design.images.length > 0 ? (
              <Image
                src={design.images[0]}
                alt={design.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Home className="h-5 w-5 md:h-8 md:w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content Container */}
          <div className="flex-1 min-w-0">
            {/* Title and Badge Row */}
            <div className="flex flex-col xs:flex-row xs:items-start justify-between mb-2 gap-1 xs:gap-2">
              <h3 className="font-semibold text-gray-900 text-base md:text-lg truncate">
                {design.name}
              </h3>
              <Badge
                variant="secondary"
                className="flex-shrink-0 w-fit text-xs md:text-sm"
              >
                {design.category}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-xs md:text-sm mb-2 line-clamp-2">
              {design.description}
            </p>

            {/* Warning Alert */}
            {disabled && disabledReason && (
              <div className="flex items-start gap-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-700">{disabledReason}</p>
              </div>
            )}

            {/* Bottom Section */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 xs:gap-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-gray-500">
                {design.price && (
                  <span className="font-semibold text-orange-600 whitespace-nowrap">
                    ₱{design.price.toLocaleString()}
                  </span>
                )}
                {design.square_meters && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <MapPin className="h-3 w-3" />
                    {design.square_meters} sqm
                  </span>
                )}
                {design.estimated_downpayment && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    Down: ₱{design.estimated_downpayment.toLocaleString()}
                  </span>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => onSelect(design)}
                disabled={disabled}
                className={`text-xs md:text-sm whitespace-nowrap ${
                  disabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                } text-white w-full xs:w-auto mt-1 xs:mt-0`}
              >
                {disabled ? "Unavailable" : "Book"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
