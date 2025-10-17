"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Home,
  Star,
  MapPin,
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { parseISO, isAfter, isBefore, isToday } from "date-fns";
import { getUserInquiries, submitInquiry } from "@/action/inquiries";
import { getDesigns } from "@/action/designs";
import { Inquiry } from "@/types/inquiry";
import { Design } from "@/types/design";
import { useAuthStore } from "@/lib/stores";
import { AppointmentCard } from "@/components/user/userappointments/AppointmentsCard";
import NotFound from "@/components/admin/NotFound";
import Image from "next/image";
import { getAvailableTimeslots } from "@/action/appointments";
import { toast } from "sonner";

interface AppointmentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Skeleton Loader Component
const AppointmentCardSkeleton = () => (
  <Card className="mb-4 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-xl animate-pulse">
    <CardContent className="p-5">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>

      {/* Schedule Details Skeleton */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>

      {/* Alert Skeleton */}
      <div className="bg-gray-100 rounded-lg p-3 mb-3 border border-gray-200">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
    </CardContent>
  </Card>
);

// Design Search Card Component
const DesignSearchCard = ({
  design,
  onSelect,
  disabled = false,
  disabledReason = "",
}: {
  design: Design;
  onSelect: (design: Design) => void;
  disabled?: boolean;
  disabledReason?: string;
}) => (
  <Card
    className={`mb-4 transition-all duration-300 border border-gray-200 rounded-xl ${
      disabled
        ? "opacity-60 cursor-not-allowed"
        : "hover:shadow-lg cursor-pointer"
    }`}
  >
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {design.images && design.images.length > 0 ? (
            <Image
              src={design.images[0]}
              alt={design.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              {design.name}
            </h3>
            <Badge variant="secondary" className="flex-shrink-0 ml-2">
              {design.category}
            </Badge>
          </div>

          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {design.description}
          </p>

          {disabled && disabledReason && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">{disabledReason}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {design.price && (
                <span className="font-semibold text-orange-600">
                  ₱{design.price.toLocaleString()}
                </span>
              )}
              {design.square_meters && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {design.square_meters} sqm
                </span>
              )}
              {design.estimated_downpayment && (
                <span className="text-xs text-gray-500">
                  Down: ₱{design.estimated_downpayment.toLocaleString()}
                </span>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => onSelect(design)}
              disabled={disabled}
              className={`${
                disabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              } text-white`}
            >
              {disabled ? "Unavailable" : "Book Consultation"}
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Label component
const Label = ({
  htmlFor,
  children,
  className,
}: {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
  </label>
);

// Booking Status Alert Component
const BookingStatusAlert = ({
  hasActiveAppointments,
  completedOrCancelledAppointments,
}: {
  hasActiveAppointments: boolean;
  completedOrCancelledAppointments: Inquiry[];
}) => {
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
};

// Booking Form Component
const BookingForm = ({
  selectedDesign,
  user,
  onBookingSuccess,
  onBack,
  hasActiveAppointments,
}: {
  selectedDesign: Design;
  user: any;
  onBookingSuccess: () => void;
  onBack: () => void;
  hasActiveAppointments: boolean;
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    preferredDate: "",
    preferredTime: "",
    meetingType: "phone" as "phone" | "onsite" | "video",
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Pre-fill user data when component mounts
  useEffect(() => {
    if (user) {
      console.log("📝 BOOKING FORM USER DATA:", {
        user_id: user.user_id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.contactNo,
      });

      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.contactNo || "",
      }));
    }
  }, [user]);

  // Fetch available timeslots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.preferredDate) {
        setAvailableTimeSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const result = await getAvailableTimeslots(formData.preferredDate);
        if (result.success && result.timeslots) {
          setAvailableTimeSlots(result.timeslots);
        } else {
          toast.error("Failed to load available time slots");
          setAvailableTimeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
        toast.error("Failed to load available time slots");
        setAvailableTimeSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [formData.preferredDate]);

  // Check if a date is a working day (Monday to Friday)
  const isWorkingDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  };

  // Get minimum selectable date (next working day)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let nextWorkingDay = new Date(tomorrow);
    while (!isWorkingDay(nextWorkingDay)) {
      nextWorkingDay.setDate(nextWorkingDay.getDate() + 1);
    }

    return nextWorkingDay.toISOString().split("T")[0];
  };

  // Get maximum selectable date (3 months from now)
  const getMaxDate = () => {
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    return threeMonthsLater.toISOString().split("T")[0];
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if user has active appointments
    if (hasActiveAppointments) {
      toast.error(
        "You already have an active appointment. Please wait for it to be completed or cancelled before booking a new one."
      );
      return;
    }

    // Validate required fields
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone
    ) {
      toast.error("Please fill in all your personal information");
      return;
    }

    if (!formData.preferredDate || !formData.preferredTime) {
      toast.error("Please select date and time for your appointment");
      return;
    }

    // Validate that selected date is a working day
    const selectedDate = new Date(formData.preferredDate);
    if (!isWorkingDay(selectedDate)) {
      toast.error(
        "Please select a weekday (Monday to Friday) for your appointment"
      );
      return;
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate phone number (should have at least 10 digits after cleaning)
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid phone number with at least 10 digits");
      return;
    }

    setIsLoading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("firstName", formData.firstName);
      formDataObj.append("lastName", formData.lastName);
      formDataObj.append("email", formData.email);
      formDataObj.append("phone", formData.phone);
      formDataObj.append("message", formData.message);
      formDataObj.append("preferredDate", formData.preferredDate);
      formDataObj.append("preferredTime", formData.preferredTime);
      formDataObj.append("meetingType", formData.meetingType);
      formDataObj.append("designId", selectedDesign.design_id);

      // CRITICAL: Use user_id from auth store
      formDataObj.append("user_id", user?.user_id || "");

      console.log("🚀 SUBMITTING INQUIRY WITH USER DATA:", {
        user_id: user?.user_id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });

      const result = await submitInquiry(formDataObj);
      if (result.success) {
        toast.success("Appointment request submitted successfully!");
        setFormData({
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
          phone: user?.contactNo || "",
          message: "",
          preferredDate: "",
          preferredTime: "",
          meetingType: "phone",
        });
        setAvailableTimeSlots([]);
        onBookingSuccess();
      } else {
        toast.error(result.error || "Failed to submit appointment request");
      }
    } catch (error) {
      console.error("Error submitting appointment request:", error);
      toast.error("An error occurred while submitting the appointment request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        ← Back to Designs
      </Button>

      <Card className="mb-4">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {selectedDesign.images && selectedDesign.images.length > 0 && (
                <Image
                  src={selectedDesign.images[0]}
                  alt={selectedDesign.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {selectedDesign.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {selectedDesign.category} • {selectedDesign.square_meters} sqm
              </p>
              {selectedDesign.price && (
                <p className="text-orange-600 font-semibold">
                  ₱{selectedDesign.price.toLocaleString()}
                </p>
              )}
              {selectedDesign.estimated_downpayment && (
                <p className="text-gray-600 text-sm">
                  Estimated Downpayment: ₱
                  {selectedDesign.estimated_downpayment.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {hasActiveAppointments && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">
                  You cannot book a new appointment while you have active
                  appointments.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">
                Your Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700"
                  >
                    First Name
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="John"
                      className="pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Doe"
                      className="pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your@email.com"
                      className="pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        // Remove all non-digit characters
                        const rawValue = e.target.value.replace(/\D/g, "");

                        // Limit to 11 digits
                        if (rawValue.length <= 11) {
                          // Format as xxxx xxx xxxx
                          let formattedValue = rawValue;
                          if (rawValue.length > 7) {
                            formattedValue = `${rawValue.slice(0, 4)} ${rawValue.slice(4, 7)} ${rawValue.slice(7, 11)}`;
                          } else if (rawValue.length > 4) {
                            formattedValue = `${rawValue.slice(0, 4)} ${rawValue.slice(4, 7)}`;
                          } else if (rawValue.length > 0) {
                            formattedValue = rawValue;
                          }

                          setFormData((prev) => ({
                            ...prev,
                            phone: formattedValue,
                          }));
                        }
                      }}
                      required
                      placeholder="9123 456 7890"
                      className="pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      maxLength={13} // 11 digits + 2 spaces
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div>
              <Label
                htmlFor="message"
                className="text-sm font-medium text-gray-700"
              >
                Project Details & Requirements
              </Label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                placeholder="Tell us about your project vision, requirements, and any specific needs..."
                rows={4}
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Appointment Scheduling */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">
                Appointment Details
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="preferredDate"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Preferred Date
                  </Label>
                  <input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preferredDate: e.target.value,
                      }))
                    }
                    required
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-orange-500"
                    onBlur={(e) => {
                      if (e.target.value) {
                        const selectedDate = new Date(e.target.value);
                        if (!isWorkingDay(selectedDate)) {
                          toast.error(
                            "Please select a weekday (Monday to Friday)"
                          );
                          setFormData((prev) => ({
                            ...prev,
                            preferredDate: "",
                          }));
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Weekdays only (Monday-Friday)
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="preferredTime"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Preferred Time
                  </Label>
                  <select
                    id="preferredTime"
                    value={formData.preferredTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preferredTime: e.target.value,
                      }))
                    }
                    required
                    disabled={!formData.preferredDate || isLoadingSlots}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="">Select time</option>
                    {availableTimeSlots.map((slot) => (
                      <option
                        key={slot.value}
                        value={slot.value}
                        disabled={!slot.enabled}
                      >
                        {slot.label} {!slot.enabled && "(Booked)"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.preferredDate &&
                      (isLoadingSlots
                        ? "Loading..."
                        : `${availableTimeSlots.filter((slot) => slot.enabled).length} slots available`)}
                  </p>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="meetingType"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Meeting Type
                </Label>
                <select
                  id="meetingType"
                  value={formData.meetingType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      meetingType: e.target.value as any,
                    }))
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="phone">Phone Call</option>
                  <option value="video">Video Call</option>
                  <option value="onsite">Onsite Meeting</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || hasActiveAppointments}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {hasActiveAppointments
                ? "Active Appointment in Progress"
                : isLoading
                  ? "Submitting..."
                  : "Book Consultation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export function AppointmentsSheet({
  open,
  onOpenChange,
}: AppointmentsSheetProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [activeTab, setActiveTab] = useState("confirmed");
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  // Use auth store for user data
  const { user, initialized } = useAuthStore();

  // Debug auth store data
  useEffect(() => {
    console.log("🔐 APPOINTMENT SHEET AUTH DATA:", {
      user: user
        ? {
            user_id: user.user_id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            contactNo: user.contactNo,
            role: user.role,
          }
        : "NO USER",
      initialized,
      open,
    });
  }, [user, initialized, open]);

  useEffect(() => {
    if (open && user?.user_id && initialized) {
      console.log("🔄 Fetching data for user:", user.user_id);
      fetchUserInquiries();
      fetchDesigns();
    }
  }, [open, user?.user_id, initialized]);

  const fetchUserInquiries = async () => {
    if (!user?.user_id || !user?.email) return;

    setLoading(true);
    try {
      const result = await getUserInquiries(user.email, user.user_id);
      if (result.success && result.inquiries) {
        setInquiries(result.inquiries);
      } else {
        console.error("Failed to fetch inquiries:", result.error);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesigns = async () => {
    setLoadingDesigns(true);
    try {
      const result = await getDesigns();
      if (result.success && result.designs) {
        setDesigns(result.designs);
      } else {
        console.error("Failed to fetch designs:", result.error);
        toast.error("Failed to load designs");
      }
    } catch (error) {
      console.error("Error fetching designs:", error);
      toast.error("Failed to load designs");
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Define active appointment statuses (user cannot book new appointments if they have these)
  const ACTIVE_STATUSES = ["pending", "confirmed", "rescheduled"];

  // Define completed/cancelled statuses (user CAN book new appointments if all are these)
  const COMPLETED_OR_CANCELLED_STATUSES = ["completed", "cancelled"];

  // Check if user has any active appointments
  const hasActiveAppointments = useMemo(() => {
    return inquiries.some((inquiry) =>
      ACTIVE_STATUSES.includes(inquiry.status)
    );
  }, [inquiries]);

  // Get completed or cancelled appointments
  const completedOrCancelledAppointments = useMemo(() => {
    return inquiries.filter((inquiry) =>
      COMPLETED_OR_CANCELLED_STATUSES.includes(inquiry.status)
    );
  }, [inquiries]);

  // Memoized filtered designs based on search query
  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;

    const query = searchQuery.toLowerCase();
    return designs.filter(
      (design) =>
        design.name.toLowerCase().includes(query) ||
        design.description.toLowerCase().includes(query) ||
        design.category.toLowerCase().includes(query)
    );
  }, [designs, searchQuery]);

  // Filter inquiries based on status and date
  const getConfirmedAppointments = () => {
    const now = new Date();
    return inquiries
      .filter((inquiry) => {
        const appointmentDate = parseISO(inquiry.preferredDate);
        const isUpcoming =
          isAfter(appointmentDate, now) || isToday(appointmentDate);
        return inquiry.status === "confirmed" && isUpcoming;
      })
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getPendingRequests = () => {
    const now = new Date();
    return inquiries
      .filter((inquiry) => {
        const appointmentDate = parseISO(inquiry.preferredDate);
        const isUpcoming =
          isAfter(appointmentDate, now) || isToday(appointmentDate);
        return inquiry.status === "pending" && isUpcoming;
      })
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getPastAppointments = () => {
    const now = new Date();
    return inquiries
      .filter((inquiry) => {
        const appointmentDate = parseISO(inquiry.preferredDate);
        return isBefore(appointmentDate, now) && !isToday(appointmentDate);
      })
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const getCompletedOrCancelledAppointments = () => {
    return inquiries
      .filter((inquiry) =>
        COMPLETED_OR_CANCELLED_STATUSES.includes(inquiry.status)
      )
      .sort((a, b) => {
        const dateA = parseISO(a.preferredDate);
        const dateB = parseISO(b.preferredDate);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const confirmedAppointments = getConfirmedAppointments();
  const pendingRequests = getPendingRequests();
  const pastAppointments = getPastAppointments();
  const completedCancelledAppointments = getCompletedOrCancelledAppointments();

  const handleBookingSuccess = () => {
    fetchUserInquiries(); // Refresh appointments
    setSelectedDesign(null); // Reset selected design
    setActiveTab("requests"); // Switch to requests tab
  };

  const handleBackToDesigns = () => {
    setSelectedDesign(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md lg:max-w-lg w-full p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>My Appointments</SheetTitle>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="px-6 pt-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="confirmed">
                Confirmed
                {confirmedAppointments.length > 0 && (
                  <Badge
                    variant="default"
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-2"
                  >
                    {confirmedAppointments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests
                {pendingRequests.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs ml-2"
                  >
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="booking">Book New</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Confirmed Appointments Tab */}
            <TabsContent value="confirmed" className="h-full m-0">
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
                        These appointments have been confirmed by our admin
                        team.
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
            </TabsContent>

            {/* Pending Requests Tab */}
            <TabsContent value="requests" className="h-full m-0">
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
                        These appointment requests are awaiting admin
                        confirmation.
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
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="h-full m-0">
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
            </TabsContent>

            {/* Booking Tab */}
            <TabsContent value="booking" className="h-full m-0">
              <ScrollArea className="h-full px-6 py-4">
                {!user ? (
                  <NotFound
                    title="Sign in required"
                    description="Please sign in to book a new appointment."
                  />
                ) : selectedDesign ? (
                  <BookingForm
                    selectedDesign={selectedDesign}
                    user={user}
                    onBookingSuccess={handleBookingSuccess}
                    onBack={handleBackToDesigns}
                    hasActiveAppointments={hasActiveAppointments}
                  />
                ) : (
                  <div>
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Book New Consultation
                      </h3>

                      {/* Booking Status Alert */}
                      <BookingStatusAlert
                        hasActiveAppointments={hasActiveAppointments}
                        completedOrCancelledAppointments={
                          completedOrCancelledAppointments
                        }
                      />

                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search designs by name, category, or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      <p className="text-sm text-gray-600 mb-4">
                        {hasActiveAppointments
                          ? "You currently have an active appointment. Please wait for it to be completed or cancelled before booking a new consultation."
                          : "Browse our design catalog and book a consultation for your favorite design. Appointments are available on weekdays (Monday-Friday) only."}
                      </p>
                    </div>

                    {loadingDesigns ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <AppointmentCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : filteredDesigns.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-4">
                          Found {filteredDesigns.length} design
                          {filteredDesigns.length !== 1 ? "s" : ""}
                          {searchQuery && ` for "${searchQuery}"`}
                        </p>
                        {filteredDesigns.map((design) => (
                          <DesignSearchCard
                            key={design.design_id}
                            design={design}
                            onSelect={setSelectedDesign}
                            disabled={hasActiveAppointments}
                            disabledReason={
                              hasActiveAppointments
                                ? "You have an active appointment. Complete or cancel it first."
                                : ""
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <NotFound
                        title="No designs found"
                        description={
                          searchQuery
                            ? `No designs found for "${searchQuery}". Try a different search term.`
                            : "No designs available at the moment."
                        }
                      />
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        {/* Refresh Button */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={fetchUserInquiries}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                Refreshing...
              </>
            ) : (
              "Refresh Appointments"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
