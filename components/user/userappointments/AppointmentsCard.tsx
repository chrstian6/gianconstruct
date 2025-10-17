import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, parseISO } from "date-fns";
import { Inquiry } from "@/types/inquiry";

interface AppointmentCardProps {
  inquiry: Inquiry;
}

export function AppointmentCard({ inquiry }: AppointmentCardProps) {
  const getStatusConfig = (status: Inquiry["status"]) => {
    const config = {
      pending: {
        variant: "secondary" as const,
        label: "Pending Review",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-800",
      },
      confirmed: {
        variant: "default" as const,
        label: "Confirmed",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-800",
      },
      cancelled: {
        variant: "destructive" as const,
        label: "Cancelled",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
      },
      rescheduled: {
        variant: "outline" as const,
        label: "Rescheduled",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
      },
      completed: {
        variant: "default" as const,
        label: "Completed",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-800",
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

  const statusConfig = getStatusConfig(inquiry.status);
  const dateInfo = formatDateDisplay(inquiry.preferredDate);
  const formattedTime = formatTimeDisplay(inquiry.preferredTime);

  return (
    <Card className="mb-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-xl">
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
            className={`px-3 py-1.5 font-semibold text-xs ${statusConfig.color} border-0`}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* Schedule Details - Emphasized */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
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
                <div className="mt-2 text-xs font-normal border-t border-emerald-200 pt-2">
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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
  );
}
