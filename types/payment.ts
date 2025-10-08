import { z } from "zod";

// Payment Type Enums
export const PaymentType = {
  DOWNPAYMENT: "downpayment",
  MONTHLY: "monthly",
  CASH: "cash",
  FULL: "full",
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const PaymentMethod = {
  CASH: "cash",
  CARD: "card",
  BANK_TRANSFER: "bank_transfer",
  CHECK: "check",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// Loan Details Schema
export const LoanDetailsSchema = z.object({
  interestRate: z.number().min(0).max(100).default(5),
  loanTerm: z.number().min(1).max(30).default(15),
  downPayment: z.number().min(0).default(0),
  monthlyPayment: z.number().min(0).default(0),
  totalLoanAmount: z.number().min(0).default(0),
  remainingBalance: z.number().min(0).default(0),
});

export type LoanDetails = z.infer<typeof LoanDetailsSchema>;

// Design Details Schema
export const DesignDetailsSchema = z.object({
  designId: z.string().optional(),
  name: z.string().min(1, "Design name is required"),
  price: z.number().min(1, "Design price must be greater than 0"),
  squareMeters: z.number().min(1, "Square meters must be greater than 0"),
  isLoanOffer: z.boolean().default(false),
  loanDetails: LoanDetailsSchema.optional(),
});

export type DesignDetails = z.infer<typeof DesignDetailsSchema>;

// User Info Schema (for payment linking)
export const UserInfoSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  contactNo: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;

// POS Payment Form Schema
export const POSPaymentFormSchema = z.object({
  // User Information
  userInfo: UserInfoSchema,

  // Payment Details
  paymentType: z.enum([
    PaymentType.DOWNPAYMENT,
    PaymentType.MONTHLY,
    PaymentType.CASH,
    PaymentType.FULL,
  ]),
  paymentMethod: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CHECK,
  ]),
  amount: z.number().min(1, "Amount must be greater than 0"),

  // Design Information
  designDetails: DesignDetailsSchema,

  // Additional Details
  notes: z.string().optional(),
});

export type POSPaymentFormValues = z.infer<typeof POSPaymentFormSchema>;

// Complete Payment Data Schema
export const PaymentDataSchema = z.object({
  id: z.string(),
  userInfo: UserInfoSchema,
  paymentType: z.enum([
    PaymentType.DOWNPAYMENT,
    PaymentType.MONTHLY,
    PaymentType.CASH,
    PaymentType.FULL,
  ]),
  paymentMethod: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CHECK,
  ]),
  amount: z.number(),
  designDetails: DesignDetailsSchema,
  status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
  ]),
  transactionDate: z.string(),
  dueDate: z.string().optional(),
  referenceNumber: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PaymentData = z.infer<typeof PaymentDataSchema>;

// Helper functions
export const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `PAY-${timestamp}-${random}`.toUpperCase();
};

export const formatCurrency = (
  amount: number,
  currency: string = "PHP"
): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getPaymentTypeLabel = (paymentType: PaymentType): string => {
  const labels = {
    [PaymentType.DOWNPAYMENT]: "Down Payment",
    [PaymentType.MONTHLY]: "Monthly Payment",
    [PaymentType.CASH]: "Cash Payment",
    [PaymentType.FULL]: "Full Payment",
  };
  return labels[paymentType];
};

export const getPaymentMethodLabel = (paymentMethod: PaymentMethod): string => {
  const labels = {
    [PaymentMethod.CASH]: "Cash",
    [PaymentMethod.CARD]: "Credit/Debit Card",
    [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
    [PaymentMethod.CHECK]: "Check",
  };
  return labels[paymentMethod];
};
