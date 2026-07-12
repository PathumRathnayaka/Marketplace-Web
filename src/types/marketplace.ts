// Types for the B2B supplier marketplace: POS shops browse products that other
// suppliers publish publicly, then contact the supplier directly to buy.

export interface MarketProduct {
  id: string;
  supplierId: string;
  productName: string;
  brand?: string;
  categoryName?: string;
  unitType?: string;
  minimumOrderQty?: number;
  availableStock?: number;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierContact {
  id: string;
  businessName: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  district?: string;
  city?: string;
  address?: string;
  profileImage?: string;
  isVerified?: boolean;
  isActive?: boolean;
}
