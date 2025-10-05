export interface ISupplier {
  _id?: string;
  supplier_id: string;
  companyName: string;
  contactPerson: string;
  contact: string;
  email?: string;
  location: string;
  status: "active" | "inactive" | "pending";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupplierFormData {
  companyName: string;
  contactPerson: string;
  contact: string;
  email?: string;
  location: string;
  status: "active" | "inactive" | "pending";
}
