"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { Design } from "@/types/design";
import { submitInquiry } from "@/action/inquiries";
import { getAvailableTimeslots } from "@/action/appointments"; // Import the server action
import {
  X,
  Home,
  Star,
  Phone,
  Mail,
  User,
  Calendar as CalendarIcon,
  Video,
  Building,
  ChevronDownIcon,
} from "lucide-react";

interface InquiryFormProps {
  selectedDesign: Design | null;
  isInquiryOpen: boolean;
  setIsInquiryOpen: (open: boolean) => void;
  onInquirySuccess: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  preferredDate: Date | undefined;
  preferredTime: string;
  meetingType: "phone" | "onsite" | "video";
}

interface TimeSlot {
  value: string;
  label: string;
  enabled: boolean;
}

export function InquiryForm({
  selectedDesign,
  isInquiryOpen,
  setIsInquiryOpen,
  onInquirySuccess,
}: InquiryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    preferredDate: undefined,
    preferredTime: "",
    meetingType: "phone",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Fetch available timeslots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!formData.preferredDate) {
        setAvailableTimeSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const dateStr = formData.preferredDate.toISOString().split("T")[0];
        const result = await getAvailableTimeslots(dateStr);

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

  // Reset time when date changes
  useEffect(() => {
    if (formData.preferredDate) {
      setFormData((prev) => ({ ...prev, preferredTime: "" }));
    }
  }, [formData.preferredDate]);

  const formatPrice = (price: number): string => {
    return `₱${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // 0 = Sunday, 6 = Saturday
        toast.error("Please select a weekday (Monday to Friday)");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        toast.error("Please select a future date for your appointment");
        return;
      }
    }

    setFormData((prev) => ({ ...prev, preferredDate: date }));
  };

  const handleSubmitInquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDesign) return;

    // Validate date is selected and is a weekday
    if (!formData.preferredDate) {
      toast.error("Please select a preferred date for your appointment");
      return;
    }

    const selectedDate = new Date(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error("Please select a future date for your appointment");
      return;
    }

    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.error("Please select a weekday (Monday to Friday)");
      return;
    }

    // Validate time is selected
    if (!formData.preferredTime) {
      toast.error("Please select a preferred time for your appointment");
      return;
    }

    // Check if the selected time is still available
    const selectedSlot = availableTimeSlots.find(
      (slot) => slot.value === formData.preferredTime && slot.enabled
    );

    if (!selectedSlot) {
      toast.error(
        "The selected time slot is no longer available. Please choose another time."
      );
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
      formDataObj.append(
        "preferredDate",
        formData.preferredDate.toISOString().split("T")[0]
      );
      formDataObj.append("preferredTime", formData.preferredTime);
      formDataObj.append("meetingType", formData.meetingType);
      formDataObj.append("designId", selectedDesign.design_id);

      const result = await submitInquiry(formDataObj);
      if (result.success) {
        toast.success("Appointment request submitted successfully!");
        setIsInquiryOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          message: "",
          preferredDate: undefined,
          preferredTime: "",
          meetingType: "phone",
        });
        setAvailableTimeSlots([]);
        onInquirySuccess();
      } else {
        toast.error(result.error || "Failed to submit appointment request");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the appointment request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsInquiryOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
      preferredDate: undefined,
      preferredTime: "",
      meetingType: "phone",
    });
    setAvailableTimeSlots([]);
  };

  // Disable weekends and past dates
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = date.getDay();
    return date < today || day === 0 || day === 6;
  };

  // Get minimum date (next weekday)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.getDay();
    if (day === 6)
      tomorrow.setDate(tomorrow.getDate() + 2); // If Saturday, go to Monday
    else if (day === 0) tomorrow.setDate(tomorrow.getDate() + 1); // If Sunday, go to Monday
    return tomorrow;
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    return threeMonthsLater;
  };

  // Get available slots count for the selected date
  const getAvailableSlotsCount = () => {
    return availableTimeSlots.filter((slot) => slot.enabled).length;
  };

  return (
    <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
      <DialogContent className="sm:max-w-4xl bg-white p-0 scroll-smooth">
        <div className="absolute right-4 top-4 z-50">
          <button
            onClick={handleClose}
            className="rounded-full p-2 bg-white/80 hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--orange)] focus:ring-offset-2 backdrop-blur-sm"
          >
            <X className="h-5 w-5 text-gray-700" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left Column - Inspiration Section */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-8 relative overflow-hidden">
            <div className="relative z-10 h-full flex flex-col">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Home className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Dream Home Studio</h3>
                </div>
                <h2 className="text-3xl font-bold leading-tight mb-4">
                  Schedule Your Consultation
                </h2>
                <p className="text-orange-100 text-lg">
                  Book an appointment to discuss your dream home with our
                  experts
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg mt-1">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Real-time Availability
                    </h4>
                    <p className="text-orange-100">
                      See available time slots that sync with our calendar
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg mt-1">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Multiple Meeting Options
                    </h4>
                    <p className="text-orange-100">
                      Phone call, video call, or onsite meeting at our office
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-2 rounded-lg mt-1">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Expert Consultation
                    </h4>
                    <p className="text-orange-100">
                      Get personalized advice from our experienced architects
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              {formData.preferredDate && (
                <div className="mb-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-orange-100 font-medium">
                      Available Slots:
                    </span>
                    <span className="text-white font-bold">
                      {isLoadingSlots ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        `${getAvailableSlotsCount()} available`
                      )}
                    </span>
                  </div>
                  <p className="text-orange-200 text-xs mt-2">
                    {format(formData.preferredDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              )}

              {/* Selected Design Preview */}
              {selectedDesign && (
                <div className="mt-auto bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-lg overflow-hidden flex-shrink-0">
                      {selectedDesign.images.length > 0 && (
                        <Image
                          src={selectedDesign.images[0]}
                          alt={selectedDesign.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">
                        {selectedDesign.name}
                      </h4>
                      <p className="text-orange-100 text-sm">
                        {formatPrice(selectedDesign.price)} •{" "}
                        {selectedDesign.square_meters} sqm
                      </p>
                      <p className="text-orange-200 text-xs truncate">
                        {selectedDesign.category}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Background Decoration */}
              <div className="absolute bottom-0 right-0 opacity-10">
                <Home className="h-48 w-48" />
              </div>
            </div>
          </div>

          {/* Right Column - Form Section */}
          <div className="p-8">
            <DialogHeader className="text-left pb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Schedule Your Consultation
              </DialogTitle>
              <p className="text-sm text-gray-500">
                Choose your preferred appointment details (Weekdays only, 8 AM -
                4 PM)
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmitInquiry} className="space-y-6">
              <div className="space-y-4">
                {/* Personal Information */}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                        required
                        placeholder="Doe"
                        className="pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={handleChange}
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

                {/* Appointment Scheduling Section */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-3 flex-1">
                      <Label
                        htmlFor="date-picker"
                        className="px-1 text-sm font-medium text-gray-700"
                      >
                        Preferred Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="date-picker"
                            className="w-full justify-start text-left font-normal border-gray-300 focus:border-orange-500 focus:ring-orange-500 py-3"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.preferredDate ? (
                              format(formData.preferredDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 z-[100]"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={formData.preferredDate}
                            onSelect={handleDateSelect}
                            disabled={isDateDisabled}
                            fromDate={getMinDate()}
                            toDate={getMaxDate()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                            classNames={{
                              day_selected:
                                "bg-orange-500 text-white hover:bg-orange-600 hover:text-white",
                              day_today: "bg-accent text-accent-foreground",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-gray-500 px-1">
                        Weekdays only
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 flex-1">
                      <Label
                        htmlFor="time-picker"
                        className="px-1 text-sm font-medium text-gray-700"
                      >
                        Preferred Time
                      </Label>
                      <Select
                        value={formData.preferredTime}
                        onValueChange={(value) =>
                          handleSelectChange("preferredTime", value)
                        }
                        required
                        disabled={!formData.preferredDate || isLoadingSlots}
                      >
                        <SelectTrigger
                          id="time-picker"
                          className="w-full justify-between font-normal border-gray-300 focus:border-orange-500 focus:ring-orange-500 py-3"
                        >
                          <SelectValue
                            placeholder={
                              isLoadingSlots
                                ? "Loading available times..."
                                : !formData.preferredDate
                                  ? "Select a date first"
                                  : "Select time"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {availableTimeSlots.map((time) => (
                            <SelectItem
                              key={time.value}
                              value={time.value}
                              disabled={!time.enabled}
                              className={
                                !time.enabled
                                  ? "text-gray-400 cursor-not-allowed"
                                  : ""
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span>{time.label}</span>
                                {!time.enabled && (
                                  <span className="text-xs text-gray-400 ml-2">
                                    Booked
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                          {availableTimeSlots.length === 0 &&
                            formData.preferredDate && (
                              <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                                No available time slots
                              </div>
                            )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 px-1">
                        {formData.preferredDate &&
                          (isLoadingSlots
                            ? "Checking availability..."
                            : `${getAvailableSlotsCount()} slots available`)}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <Label
                      htmlFor="meetingType"
                      className="text-sm font-medium text-gray-700"
                    >
                      Meeting Type
                    </Label>
                    <div className="relative mt-1">
                      <Select
                        value={formData.meetingType}
                        onValueChange={(value: "phone" | "onsite" | "video") =>
                          handleSelectChange("meetingType", value)
                        }
                        required
                      >
                        <SelectTrigger className="py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                          <SelectValue placeholder="Select meeting type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Phone Call
                            </div>
                          </SelectItem>
                          <SelectItem value="video">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              Video Call
                            </div>
                          </SelectItem>
                          <SelectItem value="onsite">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Onsite Meeting
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Label
                    htmlFor="message"
                    className="text-sm font-medium text-gray-700"
                  >
                    Project Details & Requirements
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us about your project vision..."
                    rows={4}
                    className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500 resize-none py-3"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading || !formData.preferredTime}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scheduling Your Consultation...
                    </div>
                  ) : (
                    "Schedule Consultation"
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Required fields. By submitting, you agree to our privacy
                  policy and terms of service. We'll contact you to confirm your
                  appointment details within 24 hours.
                </p>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
