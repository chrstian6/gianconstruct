import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Eye, Save, Plus, Trash2 } from "lucide-react";
import { AvailabilitySettings, TimeSlot } from "@/types/timeslot";

interface AvailabilityCardProps {
  availabilitySettings: AvailabilitySettings;
  onAvailabilitySettingsChange: (settings: AvailabilitySettings) => void;
  isEditingAvailability: boolean;
  onEditingChange: (editing: boolean) => void;
  onSaveAvailability: () => void;
  timeSlots: TimeSlot[];
}

export default function AvailabilityCard({
  availabilitySettings,
  onAvailabilitySettingsChange,
  isEditingAvailability,
  onEditingChange,
  onSaveAvailability,
  timeSlots,
}: AvailabilityCardProps) {
  const addBreak = () => {
    onAvailabilitySettingsChange({
      ...availabilitySettings,
      breaks: [
        ...availabilitySettings.breaks,
        { start: "12:00", end: "13:00" },
      ],
    });
  };

  const removeBreak = (index: number) => {
    onAvailabilitySettingsChange({
      ...availabilitySettings,
      breaks: availabilitySettings.breaks.filter((_, i) => i !== index),
    });
  };

  const updateBreak = (
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    onAvailabilitySettingsChange({
      ...availabilitySettings,
      breaks: availabilitySettings.breaks.map((breakTime, i) =>
        i === index ? { ...breakTime, [field]: value } : breakTime
      ),
    });
  };

  const toggleWorkingDay = (day: number) => {
    onAvailabilitySettingsChange({
      ...availabilitySettings,
      workingDays: availabilitySettings.workingDays.includes(day)
        ? availabilitySettings.workingDays.filter((d) => d !== day)
        : [...availabilitySettings.workingDays, day],
    });
  };

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

  // Get available slots summary
  const getSlotsSummary = () => {
    const totalSlots = timeSlots.length;
    const availableSlots = timeSlots.filter((slot) => slot.enabled).length;
    return { totalSlots, availableSlots };
  };

  // Check if current settings match the default (Mon-Fri)
  const isDefaultSchedule = () => {
    const defaultDays = [1, 2, 3, 4, 5]; // Monday to Friday
    return (
      JSON.stringify([...availabilitySettings.workingDays].sort()) ===
      JSON.stringify(defaultDays)
    );
  };

  const { totalSlots, availableSlots } = getSlotsSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Availability
          </div>
          <Button
            variant={isEditingAvailability ? "default" : "outline"}
            size="sm"
            onClick={() => onEditingChange(!isEditingAvailability)}
          >
            {isEditingAvailability ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          {isEditingAvailability
            ? "Configure your available time slots and working days"
            : "Manage your available time slots"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditingAvailability ? (
          <div className="space-y-4">
            {/* Working Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-sm">
                  Start Time
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={availabilitySettings.startTime}
                  onChange={(e) =>
                    onAvailabilitySettingsChange({
                      ...availabilitySettings,
                      startTime: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" className="text-sm">
                  End Time
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={availabilitySettings.endTime}
                  onChange={(e) =>
                    onAvailabilitySettingsChange({
                      ...availabilitySettings,
                      endTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Slot Duration */}
            <div className="space-y-2">
              <Label htmlFor="slot-duration" className="text-sm">
                Slot Duration (minutes)
              </Label>
              <Select
                value={availabilitySettings.slotDuration.toString()}
                onValueChange={(value) =>
                  onAvailabilitySettingsChange({
                    ...availabilitySettings,
                    slotDuration: parseInt(value),
                  })
                }
              >
                <SelectTrigger id="slot-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Working Days */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Working Days</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onAvailabilitySettingsChange({
                        ...availabilitySettings,
                        workingDays: [1, 2, 3, 4, 5], // Mon-Fri
                      })
                    }
                  >
                    Weekdays
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onAvailabilitySettingsChange({
                        ...availabilitySettings,
                        workingDays: [0, 1, 2, 3, 4, 5, 6], // All days
                      })
                    }
                  >
                    All Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onAvailabilitySettingsChange({
                        ...availabilitySettings,
                        workingDays: [], // Clear all
                      })
                    }
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={
                      availabilitySettings.workingDays.includes(day)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleWorkingDay(day)}
                    className="justify-start"
                  >
                    {getDayName(day)}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {availabilitySettings.workingDays.length === 0
                  ? "No working days selected"
                  : `Selected: ${availabilitySettings.workingDays.length} day${availabilitySettings.workingDays.length !== 1 ? "s" : ""}`}
              </div>
            </div>

            {/* Breaks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Breaks</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBreak}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Break
                </Button>
              </div>
              {availabilitySettings.breaks.length === 0 ? (
                <div className="text-center py-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    No breaks configured
                  </p>
                </div>
              ) : (
                availabilitySettings.breaks.map((breakTime, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={breakTime.start}
                      onChange={(e) =>
                        updateBreak(index, "start", e.target.value)
                      }
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={breakTime.end}
                      onChange={(e) =>
                        updateBreak(index, "end", e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBreak(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Preview Summary */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Preview</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total slots per day:</span>
                  <span>{totalSlots}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available slots:</span>
                  <span>{availableSlots}</span>
                </div>
                <div className="flex justify-between">
                  <span>Working days:</span>
                  <span>{availabilitySettings.workingDays.length}</span>
                </div>
              </div>
            </div>

            <Button onClick={onSaveAvailability} className="w-full gap-2">
              <Save className="h-4 w-4" />
              Save Availability
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{availableSlots}</div>
                <div className="text-xs text-muted-foreground">Slots/Day</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {availabilitySettings.workingDays.length}
                </div>
                <div className="text-xs text-muted-foreground">Days/Week</div>
              </div>
            </div>

            {/* Settings Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Working Hours:</span>
                <span className="font-medium">
                  {availabilitySettings.startTime} -{" "}
                  {availabilitySettings.endTime}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Slot Duration:</span>
                <span className="font-medium">
                  {availabilitySettings.slotDuration} minutes
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Working Days:</span>
                <span className="font-medium text-right">
                  {availabilitySettings.workingDays.length === 0
                    ? "No days selected"
                    : availabilitySettings.workingDays.length === 7
                      ? "Every day"
                      : availabilitySettings.workingDays
                          .sort()
                          .map((day) => getDayName(day).slice(0, 3))
                          .join(", ")}
                </span>
              </div>
              {availabilitySettings.breaks.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Breaks:</span>
                  <span className="font-medium text-right">
                    {availabilitySettings.breaks
                      .map((breakTime) => `${breakTime.start}-${breakTime.end}`)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Schedule Type Badge */}
            <div className="pt-2 border-t">
              <div className="flex justify-center">
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    isDefaultSchedule()
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {isDefaultSchedule()
                    ? "Standard Schedule"
                    : "Custom Schedule"}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
