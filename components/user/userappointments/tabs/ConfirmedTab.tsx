import { ScrollArea } from "@/components/ui/scroll-area";
import { Inquiry } from "@/types/inquiry";
import { AppointmentCard } from "@/components/user/userappointments/AppointmentsCard";
import NotFound from "@/components/admin/NotFound";
import { AppointmentCardSkeleton } from "./skeletons/AppointmentCardSkeleton";

interface ConfirmedTabProps {
  loading: boolean;
  user: any;
  confirmedAppointments: Inquiry[];
}

export function ConfirmedTab({
  loading,
  user,
  confirmedAppointments,
}: ConfirmedTabProps) {
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
          description="Please sign in to view your confirmed appointments."
        />
      ) : confirmedAppointments.length > 0 ? (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-green-600 mb-2">
              Your Confirmed Meetings
            </h3>
            <p className="text-sm text-muted-foreground">
              These appointments have been confirmed by our admin team.
            </p>
          </div>
          {confirmedAppointments.map((inquiry) => (
            <AppointmentCard key={inquiry._id} inquiry={inquiry} />
          ))}
        </div>
      ) : (
        <NotFound
          title="No confirmed appointments"
          description="Your confirmed appointments will appear here once approved by admin."
        />
      )}
    </ScrollArea>
  );
}
