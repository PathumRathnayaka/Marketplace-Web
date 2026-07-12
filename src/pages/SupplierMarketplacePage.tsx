import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  ClipboardList,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { marketplaceApi, supplierApi } from '../services/api';
import { MarketProduct, SupplierContact } from '../types/marketplace';
import { Supplier } from '../types/pos';
import { formatMoney } from '../utils/format';
import { addToOrderGrnCart } from '../utils/orderGrnCart';
import { navigate } from '../utils/routing';

// Import an authorized marketplace supplier into the POS suppliers table (or reuse
// the existing import), returning the POS supplier id (mysqlId || id). POS marks
// these as source MARKETPLACE (shown as "Imported"); their identity lives in
// supplier-service, so the shop owner does not manage them like LOCAL suppliers.
async function ensureImportedSupplier(contact: SupplierContact): Promise<string> {
  const existing = await supplierApi.list();
  const match = existing.find((s: Supplier) => s.marketplaceSupplierId === contact.id);
  if (match) {
    return String(match.mysqlId || match.id);
  }

  const address = [contact.address, contact.city, contact.district].filter(Boolean).join(', ');
  const res: any = await supplierApi.create({
    name: contact.businessName,
    representativeName: contact.ownerName,
    contact: contact.ownerName,
    phone: contact.phone,
    email: contact.email,
    address,
    supplierSource: 'MARKETPLACE',
    marketplaceSupplierId: contact.id,
  });
  const created = res?.data || res;
  return String(created.mysqlId || created.id);
}

const ALL = 'All';

export function SupplierMarketplacePage() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [contactFor, setContactFor] = useState<MarketProduct | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketplaceApi
      .listProducts()
      .then((data) => {
        if (active) {
          setProducts(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load supplier products.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.categoryName && set.add(p.categoryName));
    return [ALL, ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== ALL && p.categoryName !== category) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        p.productName?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [products, search, category]);

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Buy from Suppliers"
        description="Browse products published by suppliers across the marketplace and contact them directly to place your order. This catalog is public — every supplier's available stock is shown here."
      />

      {/* Search + category filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, brands, categories…"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium transition ${
                category === c
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <Package className="h-12 w-12 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">No products found</p>
          <p className="mt-1 text-sm text-slate-500">
            {products.length === 0
              ? 'Suppliers have not published any products yet.'
              : 'Try a different search or category.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onContact={() => setContactFor(product)} />
          ))}
        </div>
      )}

      {contactFor ? (
        <ContactModal product={contactFor} onClose={() => setContactFor(null)} />
      ) : null}
    </div>
  );
}

function ProductCard({
  product,
  onContact,
}: {
  product: MarketProduct;
  onContact: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Package className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.categoryName ? (
          <span className="mb-1 w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {product.categoryName}
          </span>
        ) : null}
        <h3 className="line-clamp-1 font-semibold text-slate-900 dark:text-white">
          {product.productName}
        </h3>
        {product.brand ? (
          <p className="text-xs text-slate-500">{product.brand}</p>
        ) : null}
        {product.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>
        ) : null}

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatMoney(product.price)}
            </p>
            {product.unitType ? (
              <p className="text-xs text-slate-400">per {product.unitType}</p>
            ) : null}
          </div>
          <div className="text-right text-xs text-slate-500">
            {typeof product.availableStock === 'number' ? (
              <p>{product.availableStock} in stock</p>
            ) : null}
            {product.minimumOrderQty ? <p>Min. {product.minimumOrderQty}</p> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onContact}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          <ShoppingCart className="h-4 w-4" />
          Contact supplier
        </button>
      </div>
    </div>
  );
}

function ContactModal({ product, onClose }: { product: MarketProduct; onClose: () => void }) {
  const [supplier, setSupplier] = useState<SupplierContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketplaceApi
      .getSupplier(product.supplierId)
      .then((data) => {
        if (active) {
          setSupplier(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load supplier details.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [product.supplierId]);

  // Import the supplier into POS (as an "Imported" supplier), queue this product
  // onto the draft Order GRN, then jump to the Order GRN page to receive it.
  const handleAddOrderGrn = async () => {
    if (!supplier) return;
    setAdding(true);
    setAddError(null);
    try {
      const posSupplierId = await ensureImportedSupplier(supplier);
      addToOrderGrnCart(supplier.id, posSupplierId, supplier, {
        marketProductId: product.id,
        productName: product.productName,
        brand: product.brand,
        categoryName: product.categoryName,
        unitType: product.unitType,
        price: product.price,
        minimumOrderQty: product.minimumOrderQty,
        quantity: product.minimumOrderQty && product.minimumOrderQty > 0 ? product.minimumOrderQty : 1,
      });
      navigate('/grns/order');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add to Order GRN.');
      setAdding(false);
    }
  };

  const phoneDigits = supplier?.phone?.replace(/[^\d+]/g, '') ?? '';
  const waNumber = phoneDigits.replace(/\D/g, '');
  const waText = encodeURIComponent(
    `Hi ${supplier?.businessName ?? ''}, I'm interested in "${product.productName}" (${formatMoney(
      product.price,
    )}) from the marketplace. Is it available?`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">Contact supplier</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-800/50">
            <p className="font-medium text-slate-900 dark:text-white">{product.productName}</p>
            <p className="text-slate-500">
              {formatMoney(product.price)}
              {product.unitType ? ` per ${product.unitType}` : ''}
              {product.minimumOrderQty ? ` · min. ${product.minimumOrderQty}` : ''}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : supplier ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {supplier.profileImage ? (
                    <img src={supplier.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {supplier.businessName}
                    </p>
                    {supplier.isVerified ? (
                      <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : null}
                  </div>
                  {supplier.businessType ? (
                    <p className="text-xs text-slate-500">{supplier.businessType}</p>
                  ) : null}
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                {supplier.ownerName ? (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Owner:</span>
                    {supplier.ownerName}
                  </div>
                ) : null}
                {supplier.city || supplier.district ? (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {[supplier.address, supplier.city, supplier.district].filter(Boolean).join(', ')}
                  </div>
                ) : null}
                {supplier.phone ? (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {supplier.phone}
                  </div>
                ) : null}
                {supplier.email ? (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {supplier.email}
                  </div>
                ) : null}
              </dl>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {supplier.phone ? (
                  <a
                    href={`tel:${phoneDigits}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                ) : null}
                {waNumber ? (
                  <a
                    href={`https://wa.me/${waNumber}?text=${waText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-600 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                ) : null}
                {supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}?subject=${encodeURIComponent(
                      `Order enquiry: ${product.productName}`,
                    )}`}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Mail className="h-4 w-4" /> Email
                  </a>
                ) : null}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleAddOrderGrn}
                  disabled={adding}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                  Add Order GRN
                </button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  Receives this product as stock and notifies the supplier of your order.
                </p>
                {addError ? (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                    {addError}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
