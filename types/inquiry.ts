// types/inquiry.ts

export interface InquiryDesign {
  id: string;
  name: string;
  price?: number;
  square_meters?: number;
}

export interface Inquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  preferredDate: string;
  preferredTime: string;
  meetingType: "phone" | "onsite" | "video";
  design: InquiryDesign;
  submittedAt: string;
  status: "pending" | "confirmed" | "cancelled" | "rescheduled" | "completed";
  notes?: string;
  cancellationReason?: string;
  rescheduleNotes?: string;
}

export interface InquiryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  preferredDate: Date | undefined;
  preferredTime: string;
  meetingType: "phone" | "onsite" | "video";
}

export interface InquirySubmitResponse {
  success: boolean;
  error?: string;
  data?: {
    id: string;
  };
}

export interface InquiriesResponse {
  success: boolean;
  inquiries?: Inquiry[];
  error?: string;
}

export interface InquiryActionResponse {
  success: boolean;
  error?: string;
  inquiry?: Inquiry;
}
