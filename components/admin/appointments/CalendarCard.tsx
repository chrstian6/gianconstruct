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
import { TimeSlot } from "@/types/timeslot";

interface CalendarCardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  availableSlots: TimeSlot[];
  bookedSlots?: string[]; // Array of booked time values like ["08:00", "09:30"]
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
}: CalendarCardProps) {
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateChange(newDate);
  };

  const isWorkingDay = () => {
    const dayOfWeek = selectedDate.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendar
        </CardTitle>
        <CardDescription>
          {isWorkingDay()
            ? `Available slots for ${selectedDate.toLocaleDateString("en-US", { weekday: "long" })}`
            : "Weekend - No appointments available"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("prev")}
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
            {!isWorkingDay() ? (
              <div className="text-center py-6 space-y-2 rounded-lg border border-dashed">
                <div className="text-muted-foreground">
                  Weekend dates are not available for appointments
                </div>
                <div className="text-xs text-muted-foreground">
                  Please select a weekday (Monday - Friday)
                </div>
              </div>
            ) : totalSlots === 0 ? (
              <div className="text-center py-6 border border-dashed">
                <p className="text-muted-foreground">
                  No time slots configured
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
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        group.status === "available"
                          ? "border-border bg-card hover:bg-muted/50"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
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
        {isWorkingDay() && totalSlots > 0 && (
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
