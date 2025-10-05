// types/timeslot.ts

export interface TimeSlot {
  value: string;
  label: string;
  enabled: boolean;
}

export interface Timeslot {
  _id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  isAvailable: boolean;
  inquiryId?: string; // Reference to booked inquiry
  meetingType?: "phone" | "onsite" | "video";
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySettings {
  startTime: string;
  endTime: string;
  slotDuration: number;
  breaks: BreakTime[];
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export interface BreakTime {
  start: string;
  end: string;
}

export interface TimeslotResponse {
  success: boolean;
  timeslots?: TimeSlot[];
  error?: string;
}

export interface TimeslotsResponse {
  success: boolean;
  timeslots?: Timeslot[];
  error?: string;
}

export interface AvailabilityResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface TimeslotFilters {
  date?: string;
  isAvailable?: boolean;
  meetingType?: "phone" | "onsite" | "video";
}
