export interface Product {
  id?: string;
  mysqlId?: string;
  name?: string;
  category?: string;
  categoryName?: string;
  unitType?: string;
  status?: string;
  minimumQuantity?: number;
  deleted?: boolean;
  createdDate?: string;
  tenantId?: string;
}

export interface SaleItem {
  mysqlId?: string;
  productId?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  unitPrice?: number;
  subtotal?: number;
  ourPrice?: number;
}

export interface Sale {
  id?: string;
  mysqlId?: string;
  saleId?: string;
  customerId?: string;
  customerContact?: string;
  cashierId?: string;
  cashierName?: string;
  subTotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
  saleDate?: string;
  saleItems?: SaleItem[];
}

export interface GrnItem {
  mysqlId?: string;
  productId?: string;
  productName?: string;
  variation?: string;
  variationId?: string;
  quantity?: number;
  purchasePrice?: number;
  salePrice?: number;
  ourPrice?: number;
  expireDate?: string;
  barcode?: string;
  brand?: string;
  batchCode?: string;
  warehouseNo?: string;
  tax?: number;
  discount?: number;
}

export interface Grn {
  id?: string;
  mysqlId?: string;
  grnCode?: string;
  supplierId?: string;
  supplierName?: string;
  invoiceNo?: string;
  receivedDate?: string;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  items?: GrnItem[];
}

export interface Wallet {
  id?: string;
  mysqlId?: string;
  customerId?: string;
  customerContact?: string;
  balance?: number;
  lastUpdated?: string;
  createdDate?: string;
}

export interface ProductQuantityBatch {
  id?: string;
  mysqlId?: string;
  productId?: string;
  productName?: string;
  variationId?: string;
  barcode?: string;
  batchCode?: string;
  quantity?: number;
  salePrice?: number;
  purchasePrice?: number;
  ourPrice?: number;
  expireDate?: string;
  warehouseNo?: string;
}

export interface Customer {
  id?: string;
  mysqlId?: string;
  contact?: string;
  email?: string;
  createdDate?: string;
}

export interface Supplier {
  id?: string;
  mysqlId?: string;
  name?: string;
  contact?: string;
  representativeName?: string;
  phone?: string;
  email?: string;
  address?: string;
  supplierSource?: string;
  marketplaceSupplierId?: string;
  marketplaceConnected?: boolean;
  createdDate?: string;
  tenantId?: string;
  timestamp?: number;
}
