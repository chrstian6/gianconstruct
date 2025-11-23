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
      className={`mb-4 transition-all duration-300 border border-gray-200 rounded-xl ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-lg cursor-pointer"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                <Home className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-lg truncate">
                {design.name}
              </h3>
              <Badge variant="secondary" className="flex-shrink-0 ml-2">
                {design.category}
              </Badge>
            </div>

            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {design.description}
            </p>

            {disabled && disabledReason && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">{disabledReason}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {design.price && (
                  <span className="font-semibold text-orange-600">
                    ₱{design.price.toLocaleString()}
                  </span>
                )}
                {design.square_meters && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {design.square_meters} sqm
                  </span>
                )}
                {design.estimated_downpayment && (
                  <span className="text-xs text-gray-500">
                    Down: ₱{design.estimated_downpayment.toLocaleString()}
                  </span>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => onSelect(design)}
                disabled={disabled}
                className={`${
                  disabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                } text-white`}
              >
                {disabled ? "Unavailable" : "Book Consultation"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
