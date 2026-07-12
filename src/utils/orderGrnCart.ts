import { SupplierContact } from '../types/marketplace';

// A shop builds an Order GRN by adding products from the marketplace "Contact
// supplier" modal, then checks out on the Order GRN page. Because the app uses a
// hand-rolled router (pages mount fresh on navigation), the draft is held in
// localStorage rather than React state. An Order GRN targets exactly ONE
// authorized supplier, so adding a product from a different supplier resets it.

const STORAGE_KEY = 'qalpos.orderGrnCart';

export interface OrderGrnCartItem {
  marketProductId: string;
  productName: string;
  brand?: string;
  categoryName?: string;
  unitType?: string;
  price: number;
  minimumOrderQty?: number;
  quantity: number;
}

export interface OrderGrnCart {
  // The authorized supplier in supplier-service (its Supplier.id == this id).
  marketplaceSupplierId: string;
  // The imported supplier's id in the POS suppliers table (mysqlId || id).
  posSupplierId: string;
  supplier: SupplierContact;
  items: OrderGrnCartItem[];
}

export function getOrderGrnCart(): OrderGrnCart | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderGrnCart;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function save(cart: OrderGrnCart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function clearOrderGrnCart() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Adds a product to the draft Order GRN. If the draft targets a different
 * supplier, it is reset to start a fresh order for the new supplier.
 */
export function addToOrderGrnCart(
  marketplaceSupplierId: string,
  posSupplierId: string,
  supplier: SupplierContact,
  item: OrderGrnCartItem,
): OrderGrnCart {
  const existing = getOrderGrnCart();
  const cart: OrderGrnCart =
    existing && existing.marketplaceSupplierId === marketplaceSupplierId
      ? { ...existing, posSupplierId, supplier }
      : { marketplaceSupplierId, posSupplierId, supplier, items: [] };

  const idx = cart.items.findIndex((i) => i.marketProductId === item.marketProductId);
  if (idx >= 0) {
    cart.items[idx] = { ...cart.items[idx], quantity: cart.items[idx].quantity + item.quantity };
  } else {
    cart.items.push(item);
  }
  save(cart);
  return cart;
}
