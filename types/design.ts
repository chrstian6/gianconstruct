export interface Design {
  design_id: string; // Custom ID replaces _id
  name: string;
  description: string;
  price: number;
  number_of_rooms: number;
  square_meters: number;
  category: string;
  images: string[];
  createdBy: string;
  isLoanOffer: boolean;
  maxLoanTerm?: number | null;
  loanTermType?: "months" | "years" | null;
  interestRate?: number | null;
  interestRateType?: "monthly" | "yearly" | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddDesignResponse {
  success: boolean;
  design?: Design;
  error?: string;
}

export interface DeleteDesignResponse {
  success: boolean;
  error?: string;
}

export interface UpdateDesignResponse {
  success: boolean;
  design?: Design;
  error?: string;
}

export interface GetDesignsResponse {
  success: boolean;
  designs?: Design[];
  data?: PaginatedDesignsResponse;
  error?: string;
}

export type RevalidatePath = string;

// New interface for login response
export interface User {
  email: string;
  role?: string; // Assuming role is part of user object based on redirect logic
  // Add other user properties as needed
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface PaginatedDesignsResponse {
  designs: Design[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
