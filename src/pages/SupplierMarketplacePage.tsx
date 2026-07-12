import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
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

type Tab = 'feed' | 'suppliers';

export function SupplierMarketplacePage() {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [contactFor, setContactFor] = useState<MarketProduct | null>(null);
  const [tab, setTab] = useState<Tab>('feed');
  // When set, the Suppliers tab shows this one supplier's storefront instead of
  // the directory.
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([marketplaceApi.listProducts(), marketplaceApi.listSuppliers()])
      .then(([productData, supplierData]) => {
        if (active) {
          setProducts(productData);
          setSuppliers(supplierData);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load the marketplace.');
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

  // How many products each supplier publishes, shown on their directory card.
  const productCountBySupplier = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.supplierId, (counts.get(p.supplierId) || 0) + 1));
    return counts;
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

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return suppliers;
    }
    return suppliers.filter(
      (s) =>
        s.businessName?.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q) ||
        s.businessType?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const openSupplier = openSupplierId
    ? suppliers.find((s) => s.id === openSupplierId) || null
    : null;
  const openSupplierProducts = useMemo(
    () => (openSupplierId ? products.filter((p) => p.supplierId === openSupplierId) : []),
    [products, openSupplierId],
  );

  const switchTab = (next: Tab) => {
    setTab(next);
    setOpenSupplierId(null);
    setSearch('');
  };

  const showProductFilters = tab === 'feed';

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Buy from Suppliers"
        description="Browse every supplier's stock as a feed, or open a single supplier to see everything they sell. This catalog is public."
      />

      {/* Feed / Suppliers tabs */}
      <div className="mb-5 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {(
          [
            { id: 'feed' as const, label: 'Feed', icon: Package },
            { id: 'suppliers' as const, label: 'Suppliers', icon: Store },
          ]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
              tab === id
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'suppliers' && suppliers.length > 0 ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {suppliers.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Search (+ category filters on the feed only). Hidden inside a supplier's
          storefront, where the product list is already scoped to that supplier. */}
      {!openSupplier ? (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                showProductFilters
                  ? 'Search products, brands, categories…'
                  : 'Search suppliers by name, type or city…'
              }
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          {showProductFilters ? (
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
          ) : null}
        </div>
      ) : null}

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
      ) : tab === 'feed' ? (
        filtered.length === 0 ? (
          <EmptyMessage
            title="No products found"
            message={
              products.length === 0
                ? 'Suppliers have not published any products yet.'
                : 'Try a different search or category.'
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onContact={() => setContactFor(product)}
              />
            ))}
          </div>
        )
      ) : openSupplier ? (
        <SupplierStorefront
          supplier={openSupplier}
          products={openSupplierProducts}
          onBack={() => setOpenSupplierId(null)}
          onContact={setContactFor}
        />
      ) : filteredSuppliers.length === 0 ? (
        <EmptyMessage
          title="No suppliers found"
          message={
            suppliers.length === 0
              ? 'No suppliers have joined the marketplace yet.'
              : 'Try a different search.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              productCount={productCountBySupplier.get(supplier.id) || 0}
              onOpen={() => setOpenSupplierId(supplier.id)}
            />
          ))}
        </div>
      )}

      {contactFor ? (
        <ContactModal product={contactFor} onClose={() => setContactFor(null)} />
      ) : null}
    </div>
  );
}

function EmptyMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
      <Package className="h-12 w-12 text-slate-300" />
      <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function SupplierCard({
  supplier,
  productCount,
  onOpen,
}: {
  supplier: SupplierContact;
  productCount: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        {supplier.profileImage ? (
          <img src={supplier.profileImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <Store className="h-7 w-7" />
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <h3 className="line-clamp-1 font-semibold text-slate-900 dark:text-white">
          {supplier.businessName}
        </h3>
        {supplier.isVerified ? (
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        ) : null}
      </div>
      {supplier.businessType ? (
        <p className="text-xs text-slate-500">{supplier.businessType}</p>
      ) : null}
      {supplier.city || supplier.district ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {[supplier.city, supplier.district].filter(Boolean).join(', ')}
        </p>
      ) : null}

      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Package className="h-3.5 w-3.5" />
        {productCount} {productCount === 1 ? 'product' : 'products'}
      </span>
    </button>
  );
}

// A single supplier's storefront: their profile header plus every product they
// publish, reached by clicking a supplier in the Suppliers tab.
function SupplierStorefront({
  supplier,
  products,
  onBack,
  onContact,
}: {
  supplier: SupplierContact;
  products: MarketProduct[];
  onBack: () => void;
  onContact: (product: MarketProduct) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-emerald-700 dark:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" />
        All suppliers
      </button>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {supplier.profileImage ? (
            <img src={supplier.profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-7 w-7" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
              {supplier.businessName}
            </h2>
            {supplier.isVerified ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : null}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {supplier.businessType ? <span>{supplier.businessType}</span> : null}
            {supplier.city || supplier.district ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[supplier.address, supplier.city, supplier.district].filter(Boolean).join(', ')}
              </span>
            ) : null}
            {supplier.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {supplier.phone}
              </span>
            ) : null}
            {supplier.email ? (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {supplier.email}
              </span>
            ) : null}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Package className="h-3.5 w-3.5" />
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </span>
      </div>

      {products.length === 0 ? (
        <EmptyMessage
          title="No products yet"
          message="This supplier has not published any products to the marketplace."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onContact={() => onContact(product)} />
          ))}
        </div>
      )}
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
