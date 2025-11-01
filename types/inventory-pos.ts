// types/inventory-pos.ts

export interface InventoryItem {
  product_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  salePrice: number;
  unitCost: number;
  description?: string;
  supplier?: string;
  location?: string;
  reorderPoint?: number;
}

export interface POSCartItem {
  product_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  availableQuantity: number;
  description?: string;
}

export interface POSClientInfo {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
}

export interface POSDiscountAndTax {
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxPercentage: number;
}

export interface InventoryPOSPayment {
  id: string;
  referenceNumber: string;
  transactionDate: string;
  dueDate?: string;
  clientInfo: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientAddress: string;
  };
  paymentMethod: "cash" | "card" | "bank_transfer" | "check";
  paymentType: "full" | "downpayment" | "monthly";
  items: POSCartItem[];
  subtotal: number;
  discountAmount?: number;
  discountPercentage?: number;
  taxAmount?: number;
  taxPercentage?: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  notes?: string;
  status?: "completed" | "pending" | "failed" | "voided"; // Changed "void" to "voided"
}

export interface POSSession {
  sessionId: string;
  cart: POSCartItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  taxAmount: number;
  taxPercentage: number;
  totalAmount: number;
  clientInfo?: POSClientInfo;
}

export interface InventoryPOSResponse {
  success: boolean;
  payment?: InventoryPOSPayment;
  error?: string;
  message?: string;
}
