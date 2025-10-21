"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Filter,
  RefreshCw,
  Trash2,
  CheckSquare,
  X,
  Calendar,
} from "lucide-react";

// Server Actions
import {
  getInquiries,
  confirmInquiry,
  cancelInquiry,
  rescheduleInquiry,
  completeInquiry,
  updateAvailability,
  getAvailableTimeslots,
  initializeTimeslots,
  deleteInquiries,
  cleanupTimeslots,
  updateTimeslotsForNewDuration,
} from "@/action/appointments";

// Components
import { AppointmentCard } from "@/components/admin/appointments/AppointmentCard";
import AppointmentDetails from "@/components/admin/appointments/AppointmentDetails";
import CalendarCard from "@/components/admin/appointments/CalendarCard";
import AvailabilityCard from "@/components/admin/appointments/AvailabilityCard";
import ConfirmationModal from "@/components/ConfirmationModal";
import NotFound from "@/components/admin/NotFound";

// Skeleton Components
import {
  AppointmentCardSkeleton,
  CalendarSkeleton,
  AvailabilitySkeleton,
} from "@/components/admin/appointments/skeleton";

// Types
import { Inquiry } from "@/types/inquiry";
import { TimeSlot, AvailabilitySettings } from "@/types/timeslot";

export default function AppointmentsPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
    notes: "",
  });

  // Multi-select states
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(
    new Set()
  );
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);

  // Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  // Calendar and availability states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availabilitySettings, setAvailabilitySettings] =
    useState<AvailabilitySettings>({
      startTime: "08:00",
      endTime: "16:00",
      slotDuration: 30,
      breaks: [{ start: "12:00", end: "13:00" }],
      workingDays: [1, 2, 3, 4, 5],
    });
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Dynamic availability states
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const [isInitializingTimeslots, setIsInitializingTimeslots] = useState(false);

  // Status tags with counts
  const [statusTags, setStatusTags] = useState<
    { value: string; label: string; count: number }[]
  >([
    { value: "upcoming", label: "Upcoming", count: 0 },
    { value: "pending", label: "Pending", count: 0 },
    { value: "confirmed", label: "Confirmed", count: 0 },
    { value: "cancelled", label: "Cancelled", count: 0 },
    { value: "rescheduled", label: "Rescheduled", count: 0 },
    { value: "completed", label: "Completed", count: 0 },
    { value: "all", label: "All Appointments", count: 0 },
  ]);

  // Calculate status counts
  const calculateStatusCounts = (inquiriesList: Inquiry[]) => {
    const today = new Date().toISOString().split("T")[0];

    const pendingCount = inquiriesList.filter(
      (inquiry) => inquiry.status === "pending"
    ).length;

    // FIXED: Include both confirmed AND rescheduled appointments in upcoming
    const upcomingCount = inquiriesList.filter(
      (inquiry) =>
        (inquiry.status === "confirmed" || inquiry.status === "rescheduled") &&
        inquiry.preferredDate >= today
    ).length;

    const confirmedCount = inquiriesList.filter(
      (inquiry) => inquiry.status === "confirmed"
    ).length;
    const cancelledCount = inquiriesList.filter(
      (inquiry) => inquiry.status === "cancelled"
    ).length;
    const rescheduledCount = inquiriesList.filter(
      (inquiry) => inquiry.status === "rescheduled"
    ).length;
    const completedCount = inquiriesList.filter(
      (inquiry) => inquiry.status === "completed"
    ).length;
    const totalCount = inquiriesList.length;

    return {
      pendingCount,
      upcomingCount,
      confirmedCount,
      cancelledCount,
      rescheduledCount,
      completedCount,
      totalCount,
    };
  };

  // Update status tags with counts
  const updateStatusTags = (
    counts: ReturnType<typeof calculateStatusCounts>
  ) => {
    setStatusTags([
      { value: "upcoming", label: "Upcoming", count: counts.upcomingCount },
      { value: "pending", label: "Pending", count: counts.pendingCount },
      { value: "confirmed", label: "Confirmed", count: counts.confirmedCount },
      { value: "cancelled", label: "Cancelled", count: counts.cancelledCount },
      {
        value: "rescheduled",
        label: "Rescheduled",
        count: counts.rescheduledCount,
      },
      { value: "completed", label: "Completed", count: counts.completedCount },
      { value: "all", label: "All Appointments", count: counts.totalCount },
    ]);
  };

  // Calculate max date (2 weeks from current date)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    return maxDate.toISOString().split("T")[0];
  };

  // Calculate min date (today)
  const getMinDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Multi-select functions
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (!isSelectMode) {
      setSelectedInquiries(new Set());
    }
  };

  const toggleSelectAll = () => {
    if (selectedInquiries.size === filteredInquiries.length) {
      setSelectedInquiries(new Set());
    } else {
      const allInquiryIds = filteredInquiries.map((inquiry) => inquiry._id);
      setSelectedInquiries(new Set(allInquiryIds));
    }
  };

  const toggleInquirySelection = (inquiryId: string) => {
    const newSelected = new Set(selectedInquiries);
    if (newSelected.has(inquiryId)) {
      newSelected.delete(inquiryId);
    } else {
      newSelected.add(inquiryId);
    }
    setSelectedInquiries(newSelected);
  };

  const handleMultiDeleteClick = () => {
    if (selectedInquiries.size > 0) {
      setIsMultiDeleteModalOpen(true);
    }
  };

  const handleMultiDeleteConfirm = async () => {
    if (selectedInquiries.size === 0) return;

    try {
      setActionLoading("multi-delete");
      const inquiryIds = Array.from(selectedInquiries);
      const result = await deleteInquiries(inquiryIds);

      if (result.success) {
        toast.success(
          `Successfully deleted ${selectedInquiries.size} appointment${selectedInquiries.size > 1 ? "s" : ""}`
        );

        setInquiries((prev) =>
          prev.filter((inquiry) => !selectedInquiries.has(inquiry._id))
        );

        setSelectedInquiries(new Set());
        setIsSelectMode(false);
      } else {
        toast.error(result.error || "Failed to delete appointments");
      }
    } catch (error) {
      toast.error("Failed to delete appointments");
      console.error("Error deleting appointments:", error);
    } finally {
      setActionLoading(null);
      setIsMultiDeleteModalOpen(false);
    }
  };

  // Generate time slots for preview only (not for actual booking)
  const generatePreviewTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = availabilitySettings.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = availabilitySettings.endTime
      .split(":")
      .map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Use a Set to track unique time values
    const uniqueTimes = new Set();

    for (
      let minutes = startTotalMinutes;
      minutes < endTotalMinutes;
      minutes += availabilitySettings.slotDuration
    ) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const timeValue = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

      // Skip if this time value already exists
      if (uniqueTimes.has(timeValue)) {
        continue;
      }
      uniqueTimes.add(timeValue);

      const isDuringBreak = availabilitySettings.breaks.some((breakTime) => {
        const [breakStartHour, breakStartMinute] = breakTime.start
          .split(":")
          .map(Number);
        const [breakEndHour, breakEndMinute] = breakTime.end
          .split(":")
          .map(Number);
        const breakStartMinutes = breakStartHour * 60 + breakStartMinute;
        const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

        return minutes >= breakStartMinutes && minutes < breakEndMinutes;
      });

      slots.push({
        value: timeValue,
        label: `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`,
        enabled: !isDuringBreak,
      });
    }

    return slots;
  };

  // Initialize timeslots for the date range
  const handleInitializeTimeslots = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const today = new Date();

    // Validate date range
    if (startDate < today) {
      toast.error("Start date cannot be in the past");
      return;
    }

    if (endDate > new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)) {
      toast.error("Date range cannot exceed 2 weeks from today");
      return;
    }

    if (startDate > endDate) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setIsInitializingTimeslots(true);
    try {
      const result = await initializeTimeslots(
        dateRange.startDate,
        dateRange.endDate,
        availabilitySettings
      );

      if (result.success) {
        toast.success(result.message || "Timeslots initialized successfully");
        fetchAvailableSlots(); // Refresh available slots from database
      } else {
        toast.error(result.error || "Failed to initialize timeslots");
      }
    } catch (error) {
      console.error("Error initializing timeslots:", error);
      toast.error("Failed to initialize timeslots");
    } finally {
      setIsInitializingTimeslots(false);
    }
  };

  // Clean up timeslots that are no longer in working days
  const cleanupNonWorkingDayTimeslots = async () => {
    try {
      const result = await cleanupTimeslots(availabilitySettings.workingDays);
      if (result.success) {
        console.log("Cleaned up timeslots for non-working days");
        fetchAvailableSlots(); // Refresh the slots
      }
    } catch (error) {
      console.error("Error cleaning up timeslots:", error);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchAvailableSlots(); // Only fetch from database initially
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, statusFilter]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDate]);

  // Update status counts when inquiries change
  useEffect(() => {
    const counts = calculateStatusCounts(inquiries);
    updateStatusTags(counts);
  }, [inquiries]);

  // Reset selection when filtered inquiries change
  useEffect(() => {
    if (isSelectMode) {
      setSelectedInquiries(new Set());
    }
  }, [filteredInquiries, statusFilter, searchTerm]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const result = await getInquiries();

      if (result.success && result.inquiries) {
        setInquiries(result.inquiries);
      } else {
        toast.error(result.error || "Failed to fetch inquiries");
      }
    } catch (error) {
      toast.error("Failed to fetch inquiries");
      console.error("Error fetching inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const result = await getAvailableTimeslots(dateStr);

      if (result.success && result.timeslots) {
        setAvailableSlots(result.timeslots);
      } else {
        // If no timeslots found for this date, set empty array
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setAvailableSlots([]);
    }
  };

  const filterInquiries = () => {
    let filtered = inquiries;

    if (searchTerm) {
      filtered = filtered.filter(
        (inquiry) =>
          inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.phone.includes(searchTerm) ||
          inquiry.design.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "upcoming") {
        const today = new Date().toISOString().split("T")[0];
        // FIXED: Show both confirmed AND rescheduled appointments in upcoming
        filtered = filtered.filter(
          (inquiry) =>
            (inquiry.status === "confirmed" ||
              inquiry.status === "rescheduled") &&
            inquiry.preferredDate >= today
        );
      } else if (statusFilter === "pending") {
        // Only show pending appointments in pending (not confirmed ones)
        filtered = filtered.filter((inquiry) => inquiry.status === "pending");
      } else {
        filtered = filtered.filter(
          (inquiry) => inquiry.status === statusFilter
        );
      }
    }

    setFilteredInquiries(filtered);
  };

  // FIXED: Get booked slots including both confirmed and rescheduled appointments
  const getBookedSlotsForDate = (date: Date): string[] => {
    const dateStr = date.toISOString().split("T")[0];

    // Filter inquiries that are booked for this specific date
    // Include both confirmed and rescheduled appointments (completed appointments free up slots)
    const bookedInquiries = inquiries.filter(
      (inquiry) =>
        inquiry.preferredDate === dateStr &&
        (inquiry.status === "confirmed" || inquiry.status === "rescheduled")
    );

    // Return the time values of booked appointments
    return bookedInquiries.map((inquiry) => inquiry.preferredTime);
  };

  const handleConfirmInquiry = async (inquiryId: string) => {
    try {
      setActionLoading(inquiryId);
      const result = await confirmInquiry(inquiryId);

      if (result.success) {
        toast.success("Appointment confirmed successfully");
        setInquiries((prev) =>
          prev.map((inquiry) =>
            inquiry._id === inquiryId
              ? { ...inquiry, status: "confirmed" }
              : inquiry
          )
        );
        setIsConfirmOpen(false);
        setSelectedInquiry(null);
        fetchAvailableSlots();
      } else {
        toast.error(result.error || "Failed to confirm appointment");
      }
    } catch (error) {
      toast.error("Failed to confirm appointment");
      console.error("Error confirming appointment:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteInquiry = async (inquiryId: string) => {
    try {
      setActionLoading(inquiryId);
      const result = await completeInquiry(inquiryId);

      if (result.success) {
        toast.success("Appointment marked as completed");
        setInquiries((prev) =>
          prev.map((inquiry) =>
            inquiry._id === inquiryId
              ? { ...inquiry, status: "completed" }
              : inquiry
          )
        );
        setIsCompleteOpen(false);
        setSelectedInquiry(null);
        // FIXED: Refresh available slots when appointment is completed
        fetchAvailableSlots();
      } else {
        toast.error(result.error || "Failed to complete appointment");
      }
    } catch (error) {
      toast.error("Failed to complete appointment");
      console.error("Error completing appointment:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsCompleteOpen(true);
  };

  const handleCompleteConfirm = async () => {
    if (selectedInquiry) {
      await handleCompleteInquiry(selectedInquiry._id);
    }
  };

  const handleCancelInquiry = async (inquiryId: string, reason: string) => {
    try {
      setActionLoading(inquiryId);
      const result = await cancelInquiry(inquiryId, reason);

      if (result.success) {
        toast.success("Appointment cancelled successfully");
        setInquiries((prev) =>
          prev.map((inquiry) =>
            inquiry._id === inquiryId
              ? { ...inquiry, status: "cancelled" }
              : inquiry
          )
        );
        setIsCancelOpen(false);
        setSelectedInquiry(null);
        fetchAvailableSlots();
      } else {
        toast.error(result.error || "Failed to cancel appointment");
      }
    } catch (error) {
      toast.error("Failed to cancel appointment");
      console.error("Error cancelling appointment:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRescheduleInquiry = async (inquiryId: string) => {
    if (!rescheduleData.date || !rescheduleData.time) {
      toast.error("Please select both date and time");
      return;
    }

    try {
      setActionLoading(inquiryId);
      const result = await rescheduleInquiry(
        inquiryId,
        rescheduleData.date,
        rescheduleData.time,
        rescheduleData.notes
      );

      if (result.success) {
        toast.success("Appointment rescheduled successfully");
        setInquiries((prev) =>
          prev.map((inquiry) =>
            inquiry._id === inquiryId
              ? {
                  ...inquiry,
                  preferredDate: rescheduleData.date,
                  preferredTime: rescheduleData.time,
                  status: "rescheduled",
                }
              : inquiry
          )
        );
        setIsRescheduleOpen(false);
        setSelectedInquiry(null);
        setRescheduleData({ date: "", time: "", notes: "" });
        fetchAvailableSlots();
      } else {
        toast.error(result.error || "Failed to reschedule appointment");
      }
    } catch (error) {
      toast.error("Failed to reschedule appointment");
      console.error("Error rescheduling appointment:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const [previewTimeSlots, setPreviewTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    const newPreviewSlots = generatePreviewTimeSlots();
    setPreviewTimeSlots(newPreviewSlots);
  }, [availabilitySettings]);

  // Initialize preview slots on component mount
  useEffect(() => {
    const initialPreviewSlots = generatePreviewTimeSlots();
    setPreviewTimeSlots(initialPreviewSlots);
  }, []);

  const handleSaveAvailability = async () => {
    try {
      const result = await updateAvailability(availabilitySettings);
      if (result.success) {
        toast.success("Availability settings updated successfully");
        setIsEditingAvailability(false);

        // Update preview slots to ensure consistency
        const newPreviewSlots = generatePreviewTimeSlots();
        setPreviewTimeSlots(newPreviewSlots);

        // Check if slot duration changed significantly (more than 5 minutes difference)
        const previousSettings = availabilitySettings; // You might want to track previous settings
        const durationChanged = true; // For now, always assume it changed for safety

        if (durationChanged) {
          // Use the new function to update timeslots for duration changes
          const updateResult =
            await updateTimeslotsForNewDuration(availabilitySettings);
          if (updateResult.success) {
            toast.success("Timeslots updated with new duration");
          } else {
            toast.error("Failed to update timeslots with new duration");
          }
        } else {
          // Just cleanup non-working days
          await cleanupNonWorkingDayTimeslots();
        }

        fetchAvailableSlots(); // Refresh database slots
      } else {
        toast.error(result.error || "Failed to update availability");
      }
    } catch (error) {
      toast.error("Failed to update availability");
      console.error("Error updating availability:", error);
    }
  };

  // Handler functions for AppointmentCard
  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailsOpen(true);
  };

  const handleConfirm = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsConfirmOpen(true);
  };

  const handleReschedule = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setRescheduleData({
      date: inquiry.preferredDate,
      time: inquiry.preferredTime,
      notes: "",
    });
    setIsRescheduleOpen(true);
  };

  const handleCancel = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsCancelOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6 px-10 h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Appointment Management
            </h1>
            <p className="text-muted-foreground">
              Manage and track all client consultation appointments
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Multi-select Actions */}
            {isSelectMode ? (
              <div className="flex gap-2 items-center">
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedInquiries.size === filteredInquiries.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectMode}
                  title="Cancel selection"
                >
                  <X className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMultiDeleteClick}
                  disabled={selectedInquiries.size === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title={`Delete ${selectedInquiries.size} selected appointment${selectedInquiries.size > 1 ? "s" : ""}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {selectedInquiries.size > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm"
                  >
                    {selectedInquiries.size} selected
                  </Badge>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectMode}
                className="flex items-center gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Select
              </Button>
            )}

            <Button
              onClick={fetchInquiries}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Column - Appointments List */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          {/* Filters */}
          <Card className="flex-shrink-0">
            <CardContent className="pt-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">
                    Search appointments
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, phone, or design..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Status Tags */}
              <div className="flex flex-wrap gap-2 mt-4 border-t pt-4">
                {statusTags.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => setStatusFilter(tag.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      statusFilter === tag.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <span>{tag.label}</span>
                    {tag.count > 0 && (
                      <Badge
                        variant="secondary"
                        className={`h-5 min-w-5 text-xs ${
                          statusFilter === tag.value
                            ? "bg-white text-gray-900"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {tag.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selection Header */}
          {isSelectMode && selectedInquiries.size > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <span className="text-sm text-blue-800 font-medium">
                {selectedInquiries.size} of {filteredInquiries.length} selected
              </span>
              {selectedInquiries.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleMultiDeleteClick}
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              )}
            </div>
          )}

          {/* Appointments Grid - Scrollable */}
          <div className="flex-1 min-h-0 mt-6">
            <div className="h-full overflow-y-auto space-y-4 pr-2">
              {loading ? (
                // Skeleton loading for appointment cards
                Array.from({ length: 5 }).map((_, index) => (
                  <AppointmentCardSkeleton key={index} index={index} />
                ))
              ) : filteredInquiries.length === 0 ? (
                // Use NotFound component for empty state
                <Card>
                  <CardContent className="p-8">
                    <NotFound
                      title={
                        inquiries.length === 0
                          ? "No appointments scheduled yet"
                          : "No appointments match your search"
                      }
                      description={
                        inquiries.length === 0
                          ? "When clients book consultations, they'll appear here ready for your expert touch."
                          : "Try adjusting your search terms or filters to find what you're looking for."
                      }
                    />
                  </CardContent>
                </Card>
              ) : (
                filteredInquiries.map((inquiry, index) => (
                  <div key={inquiry._id} className="flex items-start gap-3">
                    {isSelectMode && (
                      <Checkbox
                        checked={selectedInquiries.has(inquiry._id)}
                        onCheckedChange={() =>
                          toggleInquirySelection(inquiry._id)
                        }
                        className="mt-5"
                      />
                    )}
                    <div className="flex-1">
                      <AppointmentCard
                        inquiry={inquiry}
                        onViewDetails={handleViewDetails}
                        onConfirm={handleConfirm}
                        onReschedule={handleReschedule}
                        onCancel={handleCancel}
                        onComplete={handleComplete}
                        actionLoading={actionLoading}
                        index={index}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Calendar & Availability - Scrollable */}
        <div className="flex flex-col min-h-0 space-y-6">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2">
            {loading ? (
              <CalendarSkeleton />
            ) : (
              <CalendarCard
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                availableSlots={availableSlots} // Use only database slots
                bookedSlots={getBookedSlotsForDate(selectedDate)}
                availabilitySettings={availabilitySettings}
                dateRange={dateRange}
              />
            )}

            {loading ? (
              <AvailabilitySkeleton />
            ) : (
              <AvailabilityCard
                availabilitySettings={availabilitySettings}
                onAvailabilitySettingsChange={setAvailabilitySettings}
                isEditingAvailability={isEditingAvailability}
                onEditingChange={setIsEditingAvailability}
                onSaveAvailability={handleSaveAvailability}
                timeSlots={previewTimeSlots} // Use preview slots only
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onInitializeTimeslots={handleInitializeTimeslots}
                isInitializingTimeslots={isInitializingTimeslots}
                getMinDate={getMinDate}
                getMaxDate={getMaxDate}
              />
            )}
          </div>
        </div>
      </div>

      {/* All modals remain the same */}
      <AppointmentDetails
        inquiry={selectedInquiry}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      <ConfirmationModal
        isOpen={isMultiDeleteModalOpen}
        onConfirm={handleMultiDeleteConfirm}
        onCancel={() => setIsMultiDeleteModalOpen(false)}
        title={`Delete ${selectedInquiries.size} Appointment${selectedInquiries.size > 1 ? "s" : ""}`}
        description={`Are you sure you want to delete ${selectedInquiries.size} selected appointment${selectedInquiries.size > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText={
          actionLoading === "multi-delete"
            ? "Deleting..."
            : `Delete ${selectedInquiries.size} Appointment${selectedInquiries.size > 1 ? "s" : ""}`
        }
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onConfirm={() =>
          selectedInquiry && handleConfirmInquiry(selectedInquiry._id)
        }
        onCancel={() => setIsConfirmOpen(false)}
        title="Confirm Appointment"
        description={`Are you sure you want to confirm this appointment with ${selectedInquiry?.name}?`}
        confirmText={
          actionLoading === selectedInquiry?._id
            ? "Confirming..."
            : "Confirm Appointment"
        }
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={isCompleteOpen}
        onConfirm={handleCompleteConfirm}
        onCancel={() => setIsCompleteOpen(false)}
        title="Complete Appointment"
        description={`Are you sure you want to mark this appointment with ${selectedInquiry?.name} as completed?`}
        confirmText={
          actionLoading === selectedInquiry?._id
            ? "Completing..."
            : "Complete Appointment"
        }
        cancelText="Cancel"
        variant="default"
      />

      <ConfirmationModal
        isOpen={isCancelOpen}
        onConfirm={() => {
          const reason =
            (document.getElementById("cancel-reason") as HTMLTextAreaElement)
              ?.value || "No reason provided";
          selectedInquiry && handleCancelInquiry(selectedInquiry._id, reason);
        }}
        onCancel={() => setIsCancelOpen(false)}
        title="Cancel Appointment"
        description={`Please provide a reason for cancelling ${selectedInquiry?.name}'s appointment.`}
        confirmText={
          actionLoading === selectedInquiry?._id
            ? "Cancelling..."
            : "Cancel Appointment"
        }
        cancelText="Keep Appointment"
        variant="destructive"
      />

      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for {selectedInquiry?.name}&apos;s
              consultation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleData.date}
                onChange={(e) =>
                  setRescheduleData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">New Time</Label>
              <Select
                value={rescheduleData.time}
                onValueChange={(value) =>
                  setRescheduleData((prev) => ({ ...prev, time: value }))
                }
              >
                <SelectTrigger id="reschedule-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use availableSlots from database for actual booking */}
                  {availableSlots
                    .filter((slot) => slot.enabled)
                    .map((time) => (
                      <SelectItem key={time.value} value={time.value}>
                        {time.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-notes">Notes (Optional)</Label>
              <Textarea
                id="reschedule-notes"
                placeholder="Add any notes about the rescheduling..."
                value={rescheduleData.notes}
                onChange={(e) =>
                  setRescheduleData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRescheduleOpen(false);
                setRescheduleData({ date: "", time: "", notes: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedInquiry && handleRescheduleInquiry(selectedInquiry._id)
              }
              disabled={
                actionLoading === selectedInquiry?._id ||
                !rescheduleData.date ||
                !rescheduleData.time
              }
            >
              {actionLoading === selectedInquiry?._id ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reschedule Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
