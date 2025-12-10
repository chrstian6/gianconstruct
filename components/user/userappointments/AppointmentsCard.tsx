import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Inquiry } from "@/types/inquiry";
import { cancelUserInquiry } from "@/action/appointments";
import { useState } from "react";
import { Loader2, Calendar, Clock, AlertCircle } from "lucide-react";
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
        color: "text-yellow-500",
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
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        icon: "❌",
      },
      rescheduled: {
        variant: "outline" as const,
        label: "Rescheduled",
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        icon: "🔄",
      },
      completed: {
        variant: "default" as const,
        label: "Completed",
        color: "text-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
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
      mobileDate: format(date, "MMM d"),
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
      <Card className="mb-3 sm:mb-4 hover:shadow-lg transition-all duration-300 border border-gray-200">
        <CardContent className="p-3 sm:p-4 md:p-5">
          {/* Main Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
            <div className="space-y-1 flex-1">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                {getMeetingTypeLabel(inquiry.meetingType)}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium line-clamp-1">
                {inquiry.design.name}
              </p>
            </div>
            <Badge
              variant={statusConfig.variant}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 font-semibold text-xs w-fit self-start sm:self-auto ${statusConfig.color}`}
            >
              <span className="hidden sm:inline">{statusConfig.label}</span>
              <span className="sm:hidden">{statusConfig.label}</span>
            </Badge>
          </div>

          {/* Schedule Details */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Date
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  <span className="sm:hidden">{dateInfo.mobileDate}</span>
                  <span className="hidden sm:inline">{dateInfo.fullDate}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Time
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  {formattedTime}
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {inquiry.status === "pending" && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-2 sm:mb-3 p-3`}
            >
              <AlertDescription
                className={`text-xs sm:text-sm font-medium ${statusConfig.textColor}`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">⏳</span>
                  <span>
                    Your appointment is under review. We'll confirm shortly.
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {inquiry.status === "confirmed" && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-2 sm:mb-3 p-3`}
            >
              <AlertDescription
                className={`text-xs sm:text-sm font-medium ${statusConfig.textColor}`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">✅</span>
                  <div className="flex-1">
                    <span>
                      Confirmed! Please be available at the scheduled time.
                    </span>
                    {inquiry.notes && (
                      <div className="mt-2 text-xs font-normal border-t border-green-200 pt-2">
                        <strong className="font-semibold">Note:</strong>{" "}
                        {inquiry.notes}
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {inquiry.status === "cancelled" && inquiry.cancellationReason && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-2 sm:mb-3 p-3`}
            >
              <AlertDescription
                className={`text-xs sm:text-sm font-medium ${statusConfig.textColor}`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">❌</span>
                  <span>Cancelled: {inquiry.cancellationReason}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {inquiry.status === "rescheduled" && inquiry.rescheduleNotes && (
            <Alert
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-lg mb-2 sm:mb-3 p-3`}
            >
              <AlertDescription
                className={`text-xs sm:text-sm font-medium ${statusConfig.textColor}`}
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">🔄</span>
                  <span>Rescheduled: {inquiry.rescheduleNotes}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Additional Notes */}
          {inquiry.notes &&
            inquiry.status !== "confirmed" &&
            inquiry.status !== "pending" && (
              <Alert className="bg-blue-50 border-blue-200 rounded-lg mb-2 sm:mb-3 p-3">
                <AlertDescription className="text-xs sm:text-sm font-medium text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 mt-0.5">💡</span>
                    <span>
                      <strong className="font-semibold">Note:</strong>{" "}
                      {inquiry.notes}
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

          {/* Cancel Appointment Button (only for confirmed appointments) */}
          {inquiry.status === "confirmed" && (
            <div className="mt-2 sm:mt-3">
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm sm:text-base py-2 h-auto min-h-[40px] sm:min-h-[44px]"
                onClick={() => setShowCancelModal(true)}
              >
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Cancel Appointment
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 sm:pt-3 border-t border-gray-200 mt-2 sm:mt-3 gap-1 sm:gap-0">
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
