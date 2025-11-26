import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Design } from "@/types/design";
import { Inquiry } from "@/types/inquiry";
import { Search } from "lucide-react";
import { DesignSearchCard } from "@/components/user/userappointments/DesignSearchCard";
import { BookingForm } from "@/components/user/userappointments/BookingForm";
import { BookingStatusAlert } from "@/components/user/userappointments/BookingStatusAlert";
import NotFound from "@/components/admin/NotFound";
import { AppointmentCardSkeleton } from "./skeletons/AppointmentCardSkeleton";

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
  return (
    <ScrollArea className="h-full px-6 py-4">
      {!user ? (
        <NotFound
          title="Sign in required"
          description="Please sign in to book a new appointment."
        />
      ) : selectedDesign ? (
        <BookingForm
          selectedDesign={selectedDesign}
          user={user}
          onBookingSuccess={onBookingSuccess}
          onBack={onBackToDesigns}
          hasActiveAppointments={hasActiveAppointments}
        />
      ) : (
        <div>
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Book New Consultation
            </h3>

            {/* Booking Status Alert */}
            <BookingStatusAlert
              hasActiveAppointments={hasActiveAppointments}
              completedOrCancelledAppointments={
                completedOrCancelledAppointments
              }
            />

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search designs by name, category, or description..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {hasActiveAppointments
                ? "You currently have an active appointment. Please wait for it to be completed or cancelled before booking a new consultation."
                : "Browse our design catalog and book a consultation for your favorite design. Appointments are available on weekdays (Monday-Friday) only."}
            </p>
          </div>

          {loadingDesigns ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <AppointmentCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredDesigns.length > 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Found {filteredDesigns.length} design
                {filteredDesigns.length !== 1 ? "s" : ""}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              {filteredDesigns.map((design) => (
                <DesignSearchCard
                  key={design.design_id}
                  design={design}
                  onSelect={onDesignSelect}
                  disabled={hasActiveAppointments}
                  disabledReason={
                    hasActiveAppointments
                      ? "You have an active appointment. Complete or cancel it first."
                      : ""
                  }
                />
              ))}
            </div>
          ) : (
            <NotFound
              title="No designs found"
              description={
                searchQuery
                  ? `No designs found for "${searchQuery}". Try a different search term.`
                  : "No designs available at the moment."
              }
            />
          )}
        </div>
      )}
    </ScrollArea>
  );
}
