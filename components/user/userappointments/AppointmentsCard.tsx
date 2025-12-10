import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Inquiry } from "@/types/inquiry";
import { cancelUserInquiry } from "@/action/appointments";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";

interface AppointmentCardProps {
  inquiry: Inquiry;
  onCancel?: () => void; // Optional callback when appointment is cancelled
}

export function AppointmentCard({ inquiry, onCancel }: AppointmentCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const getStatusConfig = (status: Inquiry["status"]) => {
    const config = {
      pending: {
        variant: "secondary" as const,
        label: "Pending Review",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-800",
        icon: "⏳",
      },
      confirmed: {
        variant: "default" as const,
        label: "Confirmed",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
        icon: "✅",
      },
      cancelled: {
        variant: "destructive" as const,
        label: "Cancelled",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        icon: "❌",
      },
      rescheduled: {
        variant: "outline" as const,
        label: "Rescheduled",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        icon: "🔄",
      },
      completed: {
        variant: "default" as const,
        label: "Completed",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-800",
        icon: "✓",
      },
    };
    return config[status];
  };

  const getMeetingTypeLabel = (type: Inquiry["meetingType"]) => {
    const labels = {
      phone: "Phone Consultation",
      video: "Video Call",
      onsite: "On-Site Meeting",
    };
    return labels[type];
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatDateDisplay = (dateString: string) => {
    const date = parseISO(dateString);
    return {
      weekday: format(date, "EEE"),
      day: format(date, "d"),
      month: format(date, "MMM"),
      fullDate: format(date, "EEE, MMM d"),
    };
  };

  const handleCancelAppointment = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelUserInquiry(inquiry._id);
      if (result.success) {
        setShowCancelModal(false);
        // Call the onCancel callback if provided
        if (onCancel) {
          onCancel();
        }
      } else {
        alert(result.error || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("An error occurred while cancelling the appointment.");
    } finally {
      setIsCancelling(false);
    }
  };

  const statusConfig = getStatusConfig(inquiry.status);
  const dateInfo = formatDateDisplay(inquiry.preferredDate);
  const formattedTime = formatTimeDisplay(inquiry.preferredTime);

  return (
    <>
      <Card className="mb-4 hover:shadow-lg transition-all duration-300 border">
        <CardContent className="p-5">
          {/* Main Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {getMeetingTypeLabel(inquiry.meetingType)}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {inquiry.design.name}
              </p>
            </div>
            <Badge
              variant={statusConfig.variant}
              className={`px-3 py-1.5 font-semibold text-xs ${statusConfig.color}`}
            >
              {statusConfig.label}
            </Badge>
          </div>

          {/* Schedule Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Date
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {dateInfo.fullDate}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Time
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formattedTime}
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {inquiry.status === "pending" && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-3`}
            >
              <AlertDescription
                className={`text-sm font-medium ${statusConfig.textColor}`}
              >
                ⏳ Your appointment is under review. We'll confirm shortly.
              </AlertDescription>
            </Alert>
          )}

          {inquiry.status === "confirmed" && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-3`}
            >
              <AlertDescription
                className={`text-sm font-medium ${statusConfig.textColor}`}
              >
                ✅ Confirmed! Please be available at the scheduled time.
                {inquiry.notes && (
                  <div className="mt-2 text-xs font-normal border-t border-green-200 pt-2">
                    <strong>Note:</strong> {inquiry.notes}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {inquiry.status === "cancelled" && inquiry.cancellationReason && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-3`}
            >
              <AlertDescription
                className={`text-sm font-medium ${statusConfig.textColor}`}
              >
                ❌ Cancelled: {inquiry.cancellationReason}
              </AlertDescription>
            </Alert>
          )}

          {inquiry.status === "rescheduled" && inquiry.rescheduleNotes && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-3`}
            >
              <AlertDescription
                className={`text-sm font-medium ${statusConfig.textColor}`}
              >
                🔄 Rescheduled: {inquiry.rescheduleNotes}
              </AlertDescription>
            </Alert>
          )}

          {/* Additional Notes */}
          {inquiry.notes &&
            inquiry.status !== "confirmed" &&
            inquiry.status !== "pending" && (
              <Alert className="bg-blue-50 border-blue-200 rounded-lg mb-3">
                <AlertDescription className="text-sm font-medium text-blue-800">
                  💡 Note: {inquiry.notes}
                </AlertDescription>
              </Alert>
            )}

          {/* Cancel Appointment Button (only for confirmed appointments) */}
          {inquiry.status === "confirmed" && (
            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Appointment
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 font-medium">
              Submitted {format(parseISO(inquiry.submittedAt), "MMM d, yyyy")}
            </div>
            {inquiry.design.price && (
              <div className="text-sm font-bold text-gray-900">
                ₱{inquiry.design.price.toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onConfirm={handleCancelAppointment}
        onCancel={() => setShowCancelModal(false)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText={isCancelling ? "Cancelling..." : "Yes, Cancel"}
        cancelText="No, Keep Appointment"
        variant="destructive"
      />
    </>
  );
}
