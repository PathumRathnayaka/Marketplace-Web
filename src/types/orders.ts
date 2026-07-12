// Types for the B2B Order GRN flow: a POS shop places an order against an
// authorized (marketplace) supplier and the supplier-service records it so the
// supplier can see which shop ordered and contact them.

export interface ShopProfile {
  id?: string;
  shopTenantId?: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
}

export interface ShopOrderItemInput {
  productId?: string;
  productName: string;
  unitType?: string;
  quantity: number;
  price: number;
}

export interface ShopOrderInput {
  // The authorized supplier's id in supplier-service (marketplace supplier id).
  supplierId: string;
  grnCode?: string;
  items: ShopOrderItemInput[];
  shopProfile?: ShopProfile;
}

// Delivery lifecycle, driven by the supplier. The shop only reads it.
export type DeliveryStatus =
  | 'ORDERED'
  | 'PACKING'
  | 'ON_THE_WAY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface ShopOrder {
  id: string;
  supplierId: string;
  shopTenantId: string;
  grnCode?: string;
  productId?: string;
  productName: string;
  unitType?: string;
  quantity: number;
  price: number;
  status: DeliveryStatus;
  createdAt?: string;
  updatedAt?: string;
  shop?: ShopProfile;
  // Resolved on the shop's own order list, so it can chase the delivery.
  supplierName?: string;
  supplierPhone?: string;
}
