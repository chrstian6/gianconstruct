export interface Design {
  _id: string;
  design_id: string;
  name: string;
  description: string;
  price: number;
  number_of_rooms: number;
  square_meters: number;
  category: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
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

export interface GetDesignsResponse {
  success: boolean;
  designs?: Design[];
  error?: string;
}
