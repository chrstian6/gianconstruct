import { ScrollArea } from "@/components/ui/scroll-area";
import { Inquiry } from "@/types/inquiry";
import { AppointmentCard } from "@/components/user/userappointments/AppointmentsCard";
import NotFound from "@/components/admin/NotFound";
import { AppointmentCardSkeleton } from "./skeletons/AppointmentCardSkeleton";

interface RequestsTabProps {
  loading: boolean;
  user: any;
  pendingRequests: Inquiry[];
}

export function RequestsTab({
  loading,
  user,
  pendingRequests,
}: RequestsTabProps) {
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
          description="Please sign in to view your appointment requests."
        />
      ) : pendingRequests.length > 0 ? (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-orange-500 mb-2">
              Pending Approval
            </h3>
            <p className="text-sm text-muted-foreground">
              These appointment requests are awaiting admin confirmation.
            </p>
          </div>
          {pendingRequests.map((inquiry) => (
            <AppointmentCard key={inquiry._id} inquiry={inquiry} />
          ))}
        </div>
      ) : (
        <NotFound
          title="No pending requests"
          description="You haven't made any appointment requests yet."
        />
      )}
    </ScrollArea>
  );
}
