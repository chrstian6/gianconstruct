import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { TimeSlot, AvailabilitySettings } from "@/types/timeslot";

interface CalendarCardProps {
  selectedDate: Date;
  dateRange: { startDate: string; endDate: string };
  onDateChange: (date: Date) => void;
  availableSlots: TimeSlot[];
  bookedSlots?: string[]; // Array of booked time values like ["08:00", "09:30"]
  onSlotSelect?: (slot: TimeSlot) => void;
  availabilitySettings?: AvailabilitySettings; // Add this prop
}

interface TimeSlotGroup {
  type: "break" | "slot";
  startTime: string;
  endTime?: string;
  label: string;
  status?: "available" | "booked" | "break";
  slot?: TimeSlot;
}

export default function CalendarCard({
  selectedDate,
  onDateChange,
  availableSlots,
  bookedSlots = [],
  onSlotSelect,
  dateRange,
  availabilitySettings, // Add this prop
}: CalendarCardProps) {
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }

    // Don't allow navigation beyond 2 weeks from today
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);

    if (newDate <= maxDate) {
      onDateChange(newDate);
    }
  };

  // Updated isWorkingDay to use availability settings
  // In the CalendarCard component, update the isWorkingDay function:

  // Updated isWorkingDay to use availability settings and check if date has timeslots
  const isWorkingDay = () => {
    if (
      !availabilitySettings ||
      availabilitySettings.workingDays.length === 0
    ) {
      // Default to Mon-Fri if no settings provided
      const dayOfWeek = selectedDate.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    const dayOfWeek = selectedDate.getDay();
    const isConfiguredWorkingDay =
      availabilitySettings.workingDays.includes(dayOfWeek);

    // Also check if there are actually timeslots for this date
    const hasSlotsForDate = availableSlots.length > 0;

    return isConfiguredWorkingDay && hasSlotsForDate;
  };

  // Also update the getCalendarDescription function:
  // Check if date is within allowed range (2 weeks from today)
  const isDateInRange = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 14);
    maxDate.setHours(23, 59, 59, 999); // Set to end of day

    return date >= today && date <= maxDate;
  };

  // Get day name for display
  const getDayName = (day: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day];
  };

  // Get working days description
  const getWorkingDaysDescription = () => {
    if (
      !availabilitySettings ||
      availabilitySettings.workingDays.length === 0
    ) {
      return "Weekdays (Mon-Fri)";
    }

    const workingDays = availabilitySettings.workingDays.sort();

    if (workingDays.length === 7) {
      return "Every day";
    } else if (
      workingDays.length === 5 &&
      workingDays[0] === 1 &&
      workingDays[4] === 5
    ) {
      return "Weekdays (Mon-Fri)";
    } else {
      return workingDays.map((day) => getDayName(day).slice(0, 3)).join(", ");
    }
  };

  // Group consecutive break times into ranges
  const getGroupedTimeSlots = (): TimeSlotGroup[] => {
    const groups: TimeSlotGroup[] = [];
    let currentBreakGroup: TimeSlot[] = [];

    availableSlots.forEach((slot, index) => {
      if (!slot.enabled) {
        // This is a break time slot
        currentBreakGroup.push(slot);

        // If this is the last slot or next slot is not a break, finalize the group
        if (
          index === availableSlots.length - 1 ||
          availableSlots[index + 1].enabled
        ) {
          if (currentBreakGroup.length > 0) {
            const startTime = currentBreakGroup[0].label.split(" ")[0]; // Get time part only
            const endSlot = currentBreakGroup[currentBreakGroup.length - 1];
            const endTimeValue = endSlot.value;

            // Calculate end time by adding slot duration to the last break time
            const [endHours, endMinutes] = endTimeValue.split(":").map(Number);
            const endTotalMinutes = endHours * 60 + endMinutes;
            const endTimeDisplay = new Date(
              0,
              0,
              0,
              Math.floor((endTotalMinutes + 30) / 60) % 24,
              (endTotalMinutes + 30) % 60
            );
            const formattedEndTime = endTimeDisplay
              .toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              .toLowerCase();

            groups.push({
              type: "break",
              startTime: currentBreakGroup[0].value,
              endTime: `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`,
              label: `${startTime} - ${formattedEndTime} Break`,
              status: "break",
            });
            currentBreakGroup = [];
          }
        }
      } else {
        // This is a regular time slot (available or booked)
        const status = bookedSlots.includes(slot.value)
          ? "booked"
          : "available";
        groups.push({
          type: "slot",
          startTime: slot.value,
          label: slot.label,
          status,
          slot,
        });
      }
    });

    return groups;
  };

  // Count available slots (enabled and not booked)
  const getAvailableSlotsCount = () => {
    return availableSlots.filter(
      (slot) => slot.enabled && !bookedSlots.includes(slot.value)
    ).length;
  };

  // Count booked slots
  const getBookedSlotsCount = () => {
    return availableSlots.filter(
      (slot) => slot.enabled && bookedSlots.includes(slot.value)
    ).length;
  };

  // Count break slots and calculate break ranges
  const getBreakInfo = () => {
    const breakSlots = availableSlots.filter((slot) => !slot.enabled);
    const breakRanges: string[] = [];
    let currentBreakGroup: TimeSlot[] = [];

    breakSlots.forEach((slot, index) => {
      currentBreakGroup.push(slot);

      const nextSlot = breakSlots[index + 1];
      const isConsecutive =
        nextSlot &&
        parseInt(nextSlot.value.split(":")[0]) * 60 +
          parseInt(nextSlot.value.split(":")[1]) ===
          parseInt(slot.value.split(":")[0]) * 60 +
            parseInt(slot.value.split(":")[1]) +
            30;

      if (!isConsecutive) {
        if (currentBreakGroup.length > 0) {
          const startTime = currentBreakGroup[0].label.split(" ")[0];
          const endSlot = currentBreakGroup[currentBreakGroup.length - 1];
          const endTimeValue = endSlot.value;

          // Calculate end time by adding slot duration to the last break time
          const [endHours, endMinutes] = endTimeValue.split(":").map(Number);
          const endTotalMinutes = endHours * 60 + endMinutes;
          const endTimeDisplay = new Date(
            0,
            0,
            0,
            Math.floor((endTotalMinutes + 30) / 60) % 24,
            (endTotalMinutes + 30) % 60
          );
          const formattedEndTime = endTimeDisplay
            .toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .toLowerCase();

          breakRanges.push(`${startTime} - ${formattedEndTime}`);
          currentBreakGroup = [];
        }
      }
    });

    return {
      count: breakSlots.length,
      ranges: breakRanges,
    };
  };

  const totalSlots = availableSlots.length;
  const availableCount = getAvailableSlotsCount();
  const bookedCount = getBookedSlotsCount();
  const breakInfo = getBreakInfo();

  const groupedSlots = getGroupedTimeSlots();
  const canNavigatePrev = isDateInRange(
    new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000)
  );
  const canNavigateNext = isDateInRange(
    new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
  );

  // Get appropriate description based on working days and date range
  const getCalendarDescription = () => {
    if (!isDateInRange(selectedDate)) {
      return "Date is outside available range (2 weeks from today)";
    }

    if (!isWorkingDay()) {
      const dayName = getDayName(selectedDate.getDay());
      return `${dayName} - Not a working day`;
    }

    return `Available slots for ${selectedDate.toLocaleDateString("en-US", { weekday: "long" })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendar
        </CardTitle>
        <CardDescription>
          {getCalendarDescription()}
          {availabilitySettings && (
            <div className="text-xs mt-1 text-muted-foreground">
              Working days: {getWorkingDaysDescription()}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("prev")}
            disabled={!canNavigatePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <div className="font-semibold">
              {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("next")}
            disabled={!canNavigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Availability Summary */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {availableCount}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {bookedCount}
            </div>
            <div className="text-xs text-muted-foreground">Booked</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">
              {breakInfo.count}
            </div>
            <div className="text-xs text-muted-foreground">Break</div>
          </div>
        </div>

        {/* Break Time Ranges */}
        {breakInfo.ranges.length > 0 && (
          <div className="bg-muted/30 border border-border rounded-lg p-3">
            <Label className="text-sm font-medium text-foreground">
              Break Times
            </Label>
            <div className="mt-2 space-y-1">
              {breakInfo.ranges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{range}</span>
                  <Badge
                    variant="outline"
                    className="bg-muted text-muted-foreground border-border text-xs"
                  >
                    Break
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Slots */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Available Time Slots</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {!isDateInRange(selectedDate) ? (
              <div className="text-center py-6 space-y-2 rounded-lg border border-dashed">
                <div className="text-muted-foreground">
                  Date is outside available range
                </div>
                <div className="text-xs text-muted-foreground">
                  Please select a date within the next 2 weeks
                </div>
              </div>
            ) : !isWorkingDay() ? (
              <div className="text-center py-6 space-y-2 rounded-lg border border-dashed">
                <div className="text-muted-foreground">
                  {getDayName(selectedDate.getDay())} is not a working day
                </div>
                <div className="text-xs text-muted-foreground">
                  Working days: {getWorkingDaysDescription()}
                </div>
              </div>
            ) : totalSlots === 0 ? (
              <div className="text-center py-6 border border-dashed">
                <p className="text-muted-foreground">
                  No time slots configured for this date
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Update availability settings to see time slots
                </p>
              </div>
            ) : groupedSlots.length === 0 ? (
              <div className="text-center py-6 border border-dashed">
                <p className="text-muted-foreground">No available time slots</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All slots are either booked or in break time
                </p>
              </div>
            ) : (
              groupedSlots.map((group, index) => {
                if (group.type === "break") {
                  return (
                    <div
                      key={`break-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-regular text-sm text-muted-foreground">
                          {group.label}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground hover:bg-muted border-border text-xs"
                      >
                        Break Time
                      </Badge>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={`slot-${group.startTime}-${index}`}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        group.status === "available"
                          ? "border-border bg-card hover:bg-muted/50 hover:border-primary"
                          : "border-border bg-card opacity-60"
                      }`}
                      onClick={() =>
                        group.status === "available" &&
                        group.slot &&
                        onSlotSelect?.(group.slot)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-regular text-sm text-foreground">
                          {group.label}
                        </span>
                      </div>
                      <Badge
                        variant={
                          group.status === "available" ? "default" : "secondary"
                        }
                        className={`text-xs ${
                          group.status === "available"
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {group.status === "available" ? "Available" : "Booked"}
                      </Badge>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

        {/* Status Footer */}
        {isWorkingDay() && isDateInRange(selectedDate) && totalSlots > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="text-sm text-center font-medium text-foreground">
              {availableCount > 0 ? (
                <span>
                  ✓ {availableCount} slot{availableCount !== 1 ? "s" : ""}{" "}
                  available for booking
                </span>
              ) : bookedCount > 0 ? (
                <span>⏸️ All available slots are booked</span>
              ) : (
                <span>⏸️ All slots are in break time</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
