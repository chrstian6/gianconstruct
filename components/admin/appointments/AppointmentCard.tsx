"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Phone,
  Video,
  Building,
  Mail,
  User,
  Home,
  Eye,
  CheckCircle,
  CalendarClock,
  XCircle,
  MessageCircle,
  CheckSquare,
} from "lucide-react";
import { Inquiry } from "@/types/inquiry";

interface AppointmentCardProps {
  inquiry: Inquiry;
  onViewDetails: (inquiry: Inquiry) => void;
  onConfirm: (inquiry: Inquiry) => void;
  onReschedule: (inquiry: Inquiry) => void;
  onCancel: (inquiry: Inquiry) => void;
  onComplete: (inquiry: Inquiry) => void;
  actionLoading: string | null;
  index?: number;
}

export function AppointmentCard({
  inquiry,
  onViewDetails,
  onConfirm,
  onReschedule,
  onCancel,
  onComplete,
  actionLoading,
  index = 0,
}: AppointmentCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: "secondary" as const,
        label: "Pending",
        color: "bg-white text-gray-800 border-gray-300",
      },
      confirmed: {
        variant: "default" as const,
        label: "Confirmed",
        color: "bg-black text-white border-black",
      },
      cancelled: {
        variant: "destructive" as const,
        label: "Cancelled",
        color: "bg-white text-gray-800 border-gray-300",
      },
      rescheduled: {
        variant: "outline" as const,
        label: "Rescheduled",
        color: "bg-white text-gray-800 border-gray-300",
      },
      completed: {
        variant: "default" as const,
        label: "Completed",
        color: "bg-green-600 text-white border-green-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-3 w-3" />;
      case "video":
        return <Video className="h-3 w-3" />;
      case "onsite":
        return <Building className="h-3 w-3" />;
      default:
        return <Phone className="h-3 w-3" />;
    }
  };

  const getMeetingTypeText = (type: string) => {
    switch (type) {
      case "phone":
        return "Phone Call";
      case "video":
        return "Video Call";
      case "onsite":
        return "Onsite Meeting";
      default:
        return "Phone Call";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { day: "??", month: "???", weekday: "???" };
      }
      const day = date.getDate();
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
      return { day, month, weekday };
    } catch (error) {
      return { day: "??", month: "???", weekday: "???" };
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) {
      return "No time set";
    }

    try {
      const [hours, minutes] = timeString.split(":").map(Number);

      // Validate that we got valid numbers
      if (isNaN(hours) || isNaN(minutes)) {
        return "Invalid time";
      }

      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    } catch (error) {
      return "Invalid time";
    }
  };

  const { day, month, weekday } = formatDate(inquiry.preferredDate);
  const formattedTime = formatTime(inquiry.preferredTime);

  // Stack scroll animation styles
  const stackAnimation = {
    transform: `translateY(${index * 2}px)`,
    zIndex: 100 - index,
    opacity: 1 - index * 0.02,
  };

  // Render buttons based on status
  const renderActionButtons = () => {
    switch (inquiry.status) {
      case "pending":
        return (
          <>
            <Button
              size="sm"
              onClick={() => onConfirm(inquiry)}
              disabled={actionLoading === inquiry._id}
              className="gap-1 h-7 text-xs bg-black hover:bg-gray-800 text-white"
            >
              {actionLoading === inquiry._id ? (
                <>
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Confirming
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Confirm
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(inquiry)}
              disabled={actionLoading === inquiry._id}
              className="gap-1 h-7 text-xs border-gray-300 hover:bg-gray-50"
            >
              <CalendarClock className="h-3 w-3" />
              Reschedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(inquiry)}
              disabled={actionLoading === inquiry._id}
              className="gap-1 h-7 text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <XCircle className="h-3 w-3" />
              Cancel
            </Button>
          </>
        );

      case "confirmed":
      case "rescheduled":
        return (
          <>
            <Button
              size="sm"
              onClick={() => onComplete(inquiry)}
              disabled={actionLoading === inquiry._id}
              className="gap-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              {actionLoading === inquiry._id ? (
                <>
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Completing
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3" />
                  Complete
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(inquiry)}
              disabled={actionLoading === inquiry._id}
              className="gap-1 h-7 text-xs border-gray-300 hover:bg-gray-50"
            >
              <CalendarClock className="h-3 w-3" />
              Reschedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(inquiry)}
              disabled={actionLoading === inquiry._id}
              className="gap-1 h-7 text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <XCircle className="h-3 w-3" />
              Cancel
            </Button>
          </>
        );

      case "cancelled":
      case "completed":
        // Only show details button for cancelled and completed appointments
        return null;

      default:
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(inquiry)}
            disabled={actionLoading === inquiry._id}
            className="gap-1 h-7 text-xs text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <XCircle className="h-3 w-3" />
            Cancel
          </Button>
        );
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-all duration-300 border-l-4 border-l-black rounded-none hover:-translate-y-1"
      style={stackAnimation}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Left Column - Date */}
          <div className="w-32 border-r border-gray-200 flex flex-col items-center justify-center p-3">
            <div className="text-center">
              <div className="text-xs font-semibold text-black uppercase tracking-wide mb-1">
                {weekday}
              </div>
              <div className="text-2xl font-bold text-black mb-1">{day}</div>
              <div className="text-sm font-medium text-gray-700">{month}</div>
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-600 whitespace-nowrap">
                <Clock className="h-3 w-3" />
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="flex-1 p-3">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  {getMeetingTypeIcon(inquiry.meetingType)}
                  <span className="font-medium">
                    {getMeetingTypeText(inquiry.meetingType)}
                  </span>
                </div>
                <span className="text-gray-400 mx-1">•</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-gray-500" />
                  <span className="text-sm font-semibold text-black">
                    {inquiry.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(inquiry.status)}
              </div>
            </div>

            {/* Design Info */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <Home className="h-3 w-3 text-gray-500" />
                <span className="text-sm font-medium text-black">
                  {inquiry.design.name}
                </span>
                {inquiry.design.price && (
                  <span className="text-xs text-gray-600 font-semibold">
                    ₱{inquiry.design.price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Project Message */}
              {inquiry.message && (
                <div className="flex items-start gap-1 mt-1">
                  <MessageCircle className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {inquiry.message}
                  </p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{inquiry.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{inquiry.phone}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {/* Details button - Always visible for all statuses */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(inquiry)}
                className="gap-1 h-7 text-xs border-gray-300 hover:bg-gray-50"
              >
                <Eye className="h-3 w-3" />
                Details
              </Button>

              {/* Dynamic action buttons based on status */}
              {renderActionButtons()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
