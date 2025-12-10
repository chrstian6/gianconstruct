// components/user/userappointments/BookingTab.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Design } from "@/types/design";
import { Inquiry } from "@/types/inquiry";
import { Search, ChevronLeft, X } from "lucide-react";
import { DesignSearchCard } from "@/components/user/userappointments/DesignSearchCard";
import { BookingForm } from "@/components/user/userappointments/BookingForm";
import { BookingStatusAlert } from "@/components/user/userappointments/BookingStatusAlert";
import NotFound from "@/components/admin/NotFound";
import { AppointmentCardSkeleton } from "./skeletons/AppointmentCardSkeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookingTabProps {
  user: any;
  selectedDesign: Design | null;
  searchQuery: string;
  loadingDesigns: boolean;
  filteredDesigns: Design[];
  hasActiveAppointments: boolean;
  completedOrCancelledAppointments: Inquiry[];
  onSearchChange: (query: string) => void;
  onDesignSelect: (design: Design) => void;
  onBookingSuccess: () => void;
  onBackToDesigns: () => void;
}

export function BookingTab({
  user,
  selectedDesign,
  searchQuery,
  loadingDesigns,
  filteredDesigns,
  hasActiveAppointments,
  completedOrCancelledAppointments,
  onSearchChange,
  onDesignSelect,
  onBookingSuccess,
  onBackToDesigns,
}: BookingTabProps) {
  // Mobile back button for booking form
  const MobileBackButton = () => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBackToDesigns}
      className="lg:hidden mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2 text-sm"
    >
      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      Back to Designs
    </Button>
  );

  return (
    <ScrollArea className="h-full px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
      {!user ? (
        <div className="p-3 sm:p-4 lg:p-8">
          <NotFound
            title="Sign in required"
            description="Please sign in to book a new appointment."
          />
        </div>
      ) : selectedDesign ? (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Mobile Back Button - Only shows on mobile when in booking form */}
          <MobileBackButton />

          {/* Main content with responsive padding */}
          <div className="p-2 sm:p-4 lg:p-6">
            <BookingForm
              selectedDesign={selectedDesign}
              user={user}
              onBookingSuccess={onBookingSuccess}
              onBack={onBackToDesigns}
              hasActiveAppointments={hasActiveAppointments}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div className="mb-3 sm:mb-4 lg:mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 text-base sm:text-lg lg:text-xl">
              Book New Consultation
            </h3>

            {/* Booking Status Alert with responsive margin */}
            <div className="mb-3 sm:mb-4 lg:mb-6">
              <BookingStatusAlert
                hasActiveAppointments={hasActiveAppointments}
                completedOrCancelledAppointments={
                  completedOrCancelledAppointments
                }
              />
            </div>

            {/* Search Bar with responsive styling */}
            <div className="relative mb-3 sm:mb-4 lg:mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm lg:text-base h-9 sm:h-10 lg:h-11"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-0.5 sm:p-1 hover:bg-gray-100 rounded-full"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-gray-500" />
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 lg:mb-6 leading-relaxed">
              {hasActiveAppointments
                ? "You currently have an active appointment. Please wait for it to be completed or cancelled before booking a new consultation."
                : "Browse our design catalog and book a consultation for your favorite design. Appointments are available on weekdays (Monday-Friday) only."}
            </p>
          </div>

          {/* Loading State */}
          {loadingDesigns ? (
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <AppointmentCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredDesigns.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              {/* Results count with responsive text */}
              <p className="text-xs sm:text-sm lg:text-base text-gray-500">
                Found {filteredDesigns.length} design
                {filteredDesigns.length !== 1 ? "s" : ""}
                {searchQuery && (
                  <span className="font-medium"> for "{searchQuery}"</span>
                )}
              </p>

              {/* Designs grid/list with responsive layout */}
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {filteredDesigns.map((design) => (
                  <div
                    key={design.design_id}
                    className={cn(
                      "transition-transform duration-200",
                      "hover:scale-[1.005] sm:hover:scale-[1.01]",
                      hasActiveAppointments && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <DesignSearchCard
                      design={design}
                      onSelect={onDesignSelect}
                      disabled={hasActiveAppointments}
                      disabledReason={
                        hasActiveAppointments
                          ? "You have an active appointment. Complete or cancel it first."
                          : ""
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 lg:p-8">
              <NotFound
                title="No designs found"
                description={
                  searchQuery
                    ? `No designs found for "${searchQuery}". Try a different search term.`
                    : "No designs available at the moment."
                }
              />
            </div>
          )}
        </div>
      )}
    </ScrollArea>
  );
}
