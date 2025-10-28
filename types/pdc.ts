// types/pdc.ts
export interface PDCItemReference {
  product_id: string;
  quantity: number;
  unitCost: number;
  totalCapital: number;
}

export interface PDCCreateData {
  checkNumber?: string;
  checkDate: Date;
  supplier: string;
  totalAmount: number;
  itemCount: number;
  payee: string;
  amountInWords: string;
  items: PDCItemReference[];
  status?: "pending" | "issued" | "cancelled";
  notes?: string;
}

export interface PDC {
  pdc_id: string;
  checkNumber: string;
  checkDate: Date;
  supplier: string;
  totalAmount: number;
  itemCount: number;
  payee: string;
  amountInWords: string;
  items: PDCItemReference[];
  status: "pending" | "issued" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  issuedAt?: Date;
  cancelledAt?: Date;
}

export interface PDCStatusUpdate {
  status: "issued" | "cancelled";
  issuedAt?: Date;
  cancelledAt?: Date;
}

export interface PDCSearchCriteria {
  checkNumber?: string;
  supplier?: string;
  status?: "pending" | "issued" | "cancelled";
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface PDCStats {
  total: number;
  pending: number;
  issued: number;
  cancelled: number;
  totalAmount: number;
  pendingAmount: number;
  issuedAmount: number;
  cancelledAmount: number;
}

export interface PDCWithItems extends PDC {
  itemDetails?: any[];
}
