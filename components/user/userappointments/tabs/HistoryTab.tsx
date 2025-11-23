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
    <ScrollArea className="h-full px-6 py-4">
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <AppointmentCardSkeleton key={index} />
          ))}
        </div>
      ) : !user ? (
        <NotFound
          title="Sign in required"
          description="Please sign in to view your appointment history."
        />
      ) : pastAppointments.length > 0 ? (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-600 mb-2">
              Appointment History
            </h3>
            <p className="text-sm text-muted-foreground">
              Your past appointments and their status.
            </p>
          </div>
          {pastAppointments.map((inquiry) => (
            <AppointmentCard key={inquiry._id} inquiry={inquiry} />
          ))}
        </div>
      ) : (
        <NotFound
          title="No appointment history"
          description="Your past appointments will appear here."
        />
      )}
    </ScrollArea>
  );
}
