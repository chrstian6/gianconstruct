import { ScrollArea } from "@/components/ui/scroll-area";
import { Inquiry } from "@/types/inquiry";
import { AppointmentCard } from "@/components/user/userappointments/AppointmentsCard";
import NotFound from "@/components/admin/NotFound";
import { AppointmentCardSkeleton } from "./skeletons/AppointmentCardSkeleton";

interface HistoryTabProps {
  loading: boolean;
  user: any;
  pastAppointments: Inquiry[];
}

export function HistoryTab({
  loading,
  user,
  pastAppointments,
}: HistoryTabProps) {
  return (
    <div className="h-full w-full">
      {/* Mobile Header */}
      <div className="block sm:hidden px-4 pt-4 pb-2 border-b">
        <h2 className="text-lg font-semibold">Appointment History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {pastAppointments.length > 0
            ? `${pastAppointments.length} past appointments`
            : "No past appointments yet"}
        </p>
      </div>

      <ScrollArea className="h-[calc(100%-64px)] sm:h-full px-4 sm:px-6 py-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <AppointmentCardSkeleton key={index} />
            ))}
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <NotFound
              title="Sign in required"
              description="Please sign in to view your appointment history."
            />
          </div>
        ) : pastAppointments.length > 0 ? (
          <div>
            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden sm:block mb-6">
              <h3 className="font-semibold text-gray-600 mb-2">
                Appointment History
              </h3>
              <p className="text-sm text-muted-foreground">
                Your past appointments and their status.
              </p>
            </div>

            {/* Appointment Cards with mobile optimizations */}
            <div className="space-y-3 sm:space-y-4">
              {pastAppointments.map((inquiry) => (
                <div
                  key={inquiry._id}
                  className="bg-white rounded-lg shadow-sm sm:shadow-none border sm:border-0 sm:bg-transparent"
                >
                  <AppointmentCard inquiry={inquiry} />
                </div>
              ))}
            </div>

            {/* Mobile Footer Stats */}
            <div className="block sm:hidden mt-6 pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Showing {pastAppointments.length} appointment
                {pastAppointments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <NotFound
              title="No appointment history"
              description="Your past appointments will appear here."
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
