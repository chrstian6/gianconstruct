"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Design } from "@/types/design";
import { getAvailableTimeslots } from "@/action/appointments";
import { submitInquiry } from "@/action/inquiries";
import { User, Mail, Phone, XCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

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

interface BookingFormProps {
  selectedDesign: Design;
  user: any;
  onBookingSuccess: () => void;
  onBack: () => void;
  hasActiveAppointments: boolean;
}

export function BookingForm({
  selectedDesign,
  user,
  onBookingSuccess,
  onBack,
  hasActiveAppointments,
}: BookingFormProps) {
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
        role: user.role,
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

    const nextWorkingDay = new Date(tomorrow);
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

      // CRITICAL FIX: Always pass user_id for logged-in users
      if (user && user.user_id) {
        formDataObj.append("user_id", user.user_id);
        console.log("✅ ADDED USER_ID TO FORM DATA:", user.user_id);
      } else {
        console.log(
          "❌ NO USER_ID AVAILABLE - user might not be properly logged in"
        );
      }

      console.log("🚀 SUBMITTING INQUIRY WITH USER DATA:", {
        user_id: user?.user_id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        userRole: user?.role,
      });

      const result = await submitInquiry(formDataObj);
      if (result.success) {
        console.log("✅ INQUIRY SUBMITTED SUCCESSFULLY:", {
          inquiryId: result.data?.id,
          userType: result.data?.userType,
          user_id: result.data?.user_id,
        });
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
        console.error("❌ INQUIRY SUBMISSION FAILED:", result.error);
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
}
