import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Video,
  Building,
  CalendarIcon,
  Clock,
  Mail,
  User,
} from "lucide-react";
import { Inquiry } from "@/types/inquiry";

interface AppointmentDetailsProps {
  inquiry: Inquiry | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentDetail({
  inquiry,
  isOpen,
  onClose,
}: AppointmentDetailsProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
      rescheduled: { label: "Rescheduled", color: "bg-blue-100 text-blue-800" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "onsite":
        return <Building className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!inquiry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
          <DialogDescription>
            Complete information for {inquiry.name}&apos;s consultation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Client Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="font-medium">{inquiry.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {inquiry.email}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{inquiry.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(inquiry.status)}</div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h4 className="font-semibold mb-3">Appointment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Design</Label>
                <p className="font-medium">{inquiry.design.name}</p>
                {inquiry.design.price && (
                  <p className="text-muted-foreground">
                    ₱{inquiry.design.price.toLocaleString()} •{" "}
                    {inquiry.design.square_meters} sqm
                  </p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Meeting Type</Label>
                <div className="flex items-center gap-2 mt-1">
                  {getMeetingTypeIcon(inquiry.meetingType)}
                  <span className="font-medium capitalize">
                    {inquiry.meetingType}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {formatDate(inquiry.preferredDate)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Time</Label>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {inquiry.preferredTime}
                </p>
              </div>
            </div>
          </div>

          {/* Project Message */}
          {inquiry.message && (
            <div>
              <h4 className="font-semibold mb-3">Project Details</h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
              </div>
            </div>
          )}

          {/* Submission Info */}
          <div>
            <h4 className="font-semibold mb-3">Submission Information</h4>
            <div className="text-sm text-muted-foreground">
              Submitted on {new Date(inquiry.submittedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
