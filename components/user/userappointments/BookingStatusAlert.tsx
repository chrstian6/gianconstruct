import { Inquiry } from "@/types/inquiry";
import { Clock, CheckCircle2, Calendar } from "lucide-react";

interface BookingStatusAlertProps {
  hasActiveAppointments: boolean;
  completedOrCancelledAppointments: Inquiry[];
}

export function BookingStatusAlert({
  hasActiveAppointments,
  completedOrCancelledAppointments,
}: BookingStatusAlertProps) {
  if (hasActiveAppointments) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">
              Active Appointment in Progress
            </h4>
            <p className="text-yellow-700 text-sm">
              You currently have an active appointment. Please wait for it to be
              completed or cancelled before booking a new one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (completedOrCancelledAppointments.length > 0) {
    const hasCompleted = completedOrCancelledAppointments.some(
      (appt) => appt.status === "completed"
    );
    const hasCancelled = completedOrCancelledAppointments.some(
      (appt) => appt.status === "cancelled"
    );

    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-800 mb-1">
              Ready for New Booking
            </h4>
            <p className="text-green-700 text-sm">
              {hasCompleted && hasCancelled
                ? "Your previous appointments have been completed or cancelled."
                : hasCompleted
                  ? "Your previous appointment has been completed."
                  : "Your previous appointment has been cancelled."}{" "}
              You can now book a new consultation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-800 mb-1">
            Book Your First Consultation
          </h4>
          <p className="text-blue-700 text-sm">
            You can book one consultation at a time. Once completed or
            cancelled, you can book again.
          </p>
        </div>
      </div>
    </div>
  );
}
