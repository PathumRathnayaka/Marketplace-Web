import { useEffect, useMemo, useState } from 'react';
import {
    Search, Trash2, UserRound, Wallet as WalletIcon, CreditCard, Banknote,
    ScrollText, Loader2, Plus, Minus, X, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PosCustomerModal } from '../components/PosCustomerModal';
import { getStoredAuth, inventoryApi, productApi, salesApi, walletApi } from '../services/api';
import { Customer, Product, ProductQuantityBatch } from '../types/pos';
import { formatMoney } from '../utils/format';

interface Sellable {
    productId: string;
    productName: string;
    category: string;
    barcode?: string;
    salePrice: number;
    ourPrice: number;
    stock: number;
}

interface CartLine {
    productId: string;
    productName: string;
    category: string;
    salePrice: number;
    ourPrice: number;
    quantity: number;
}

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash', icon: Banknote },
    { value: 'CARD', label: 'Card', icon: CreditCard },
    { value: 'CHEQUE', label: 'Cheque', icon: ScrollText },
];

export function POSPage() {
    const [sellables, setSellables] = useState<Sellable[]>([]);
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [cart, setCart] = useState<CartLine[]>([]);
    const [discount, setDiscount] = useState<number | ''>('');
    const [customer, setCustomer] = useState<Customer | null>(null);

    const [mode, setMode] = useState<'cart' | 'payment'>('cart');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paid, setPaid] = useState<number | ''>('');
    const [addToWallet, setAddToWallet] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(true);

    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([inventoryApi.listBatches(), productApi.list()])
            .then(([batches, products]) => setSellables(buildSellables(batches, products)))
            .catch(console.error);
    }, []);

    // Load the selected customer's wallet balance so it can be applied at checkout.
    useEffect(() => {
        if (!customer) {
            setWalletBalance(0);
            return;
        }
        let active = true;
        walletApi.list()
            .then((wallets) => {
                if (!active) return;
                const cid = customer.mysqlId || customer.id;
                const w = wallets.find((x) => x.customerId === cid || x.customerContact === customer.contact);
                setWalletBalance(Number(w?.balance) || 0);
            })
            .catch(() => active && setWalletBalance(0));
        return () => { active = false; };
    }, [customer]);

    const subtotal = useMemo(
        () => cart.reduce((sum, line) => sum + line.salePrice * line.quantity, 0),
        [cart]
    );
    const discountValue = Number(discount) || 0;
    const total = Math.max(0, subtotal - discountValue);
    // Apply the customer's wallet balance against the total; they only pay the rest.
    const walletApplied = useWallet && customer ? Math.min(walletBalance, total) : 0;
    const netPayable = Math.max(0, total - walletApplied);
    const paidValue = Number(paid) || 0;
    const change = Math.max(0, paidValue - netPayable);

    const filtered = search.trim()
        ? sellables.filter((s) => {
            const q = search.trim().toLowerCase();
            return (s.productName || '').toLowerCase().includes(q) || (s.barcode || '').toLowerCase().includes(q);
        })
        : sellables;

    const addToCart = (item: Sellable) => {
        setCart((prev) => {
            const existing = prev.find((l) => l.productId === item.productId);
            if (existing) {
                return prev.map((l) => (l.productId === item.productId ? { ...l, quantity: l.quantity + 1 } : l));
            }
            return [...prev, {
                productId: item.productId, productName: item.productName, category: item.category,
                salePrice: item.salePrice, ourPrice: item.ourPrice, quantity: 1,
            }];
        });
        setSearch('');
        setShowDropdown(false);
    };

    const changeQty = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + delta } : l))
                .filter((l) => l.quantity > 0)
        );
    };

    const removeLine = (productId: string) => setCart((prev) => prev.filter((l) => l.productId !== productId));

    const resetSale = () => {
        setCart([]);
        setDiscount('');
        setCustomer(null);
        setPaid('');
        setAddToWallet(false);
        setUseWallet(true);
        setMode('cart');
    };

    const goToPayment = () => {
        setError(null);
        setSuccess(null);
        if (cart.length === 0) {
            setError('Add at least one product before payment.');
            return;
        }
        setPaid('');
        setMode('payment');
    };

    const completePayment = async () => {
        setError(null);
        if (paidValue < netPayable) {
            setError('Paid amount cannot be less than the payable amount.');
            return;
        }
        if (addToWallet && !customer) {
            setError('Select a customer to store the balance in a wallet.');
            return;
        }

        setSaving(true);
        try {
            const auth = getStoredAuth();
            const keepChangeInWallet = addToWallet && change > 0 && !!customer;

            const salePayload = {
                saleId: `SALE-${Date.now()}`,
                customerId: customer?.mysqlId || customer?.id,
                customerContact: customer?.contact,
                cashierId: auth?.user.id,
                cashierName: auth?.user.fullName,
                subTotal: subtotal,
                taxAmount: 0,
                discountAmount: discountValue,
                totalAmount: total,
                // Total is settled by wallet credit applied + cash paid.
                paidAmount: walletApplied + paidValue,
                changeAmount: keepChangeInWallet ? 0 : change,
                paymentMethod,
                saleItems: cart.map((l) => ({
                    productId: l.productId,
                    productName: l.productName,
                    category: l.category,
                    quantity: l.quantity,
                    unitPrice: l.salePrice,
                    subtotal: l.salePrice * l.quantity,
                    ourPrice: l.ourPrice,
                })),
            };

            await salesApi.create(salePayload);

            // Net wallet movement: subtract the amount spent from the wallet, then add
            // any change the cashier chose to keep in the wallet.
            const walletDelta = (keepChangeInWallet ? change : 0) - walletApplied;
            if (customer && walletDelta !== 0) {
                await adjustWallet(customer, walletDelta);
            }

            const parts: string[] = [];
            if (walletApplied > 0) parts.push(`${formatMoney(walletApplied)} paid from wallet`);
            if (keepChangeInWallet) parts.push(`${formatMoney(change)} change added to wallet`);
            setSuccess(parts.length ? `Sale completed. ${parts.join(', ')}.` : 'Sale completed successfully.');
            resetSale();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to complete the sale.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <PageHeader title="POS System" description="Search products, build the cart, and check out a sale." />
                {customer && (
                    <span className="inline-flex items-center gap-2 self-start rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                        <UserRound className="h-4 w-4" /> {customer.contact}
                        <button onClick={() => setCustomer(null)} className="text-emerald-500 hover:text-emerald-700">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </span>
                )}
            </div>

            {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>}
            {success && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" /> {success}
                </div>
            )}

            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_320px]">
                {/* Main area */}
                <div className="min-w-0">
                    {mode === 'cart' ? (
                        <CartView
                            search={search} setSearch={setSearch}
                            showDropdown={showDropdown} setShowDropdown={setShowDropdown}
                            filtered={filtered} addToCart={addToCart}
                            cart={cart} changeQty={changeQty} removeLine={removeLine}
                            subtotal={subtotal} discount={discount} setDiscount={setDiscount} total={total}
                        />
                    ) : (
                        <PaymentView
                            cart={cart} subtotal={subtotal} discountValue={discountValue} total={total}
                            paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                            paid={paid} setPaid={setPaid} change={change}
                            customer={customer} addToWallet={addToWallet} setAddToWallet={setAddToWallet}
                            walletBalance={walletBalance} walletApplied={walletApplied} netPayable={netPayable}
                            useWallet={useWallet} setUseWallet={setUseWallet}
                            onCancel={() => setMode('cart')} onComplete={completePayment} saving={saving}
                        />
                    )}
                </div>

                {/* Action panel */}
                <aside className="space-y-3">
                    <ActionButton icon={UserRound} label="Customer" onClick={() => setIsCustomerModalOpen(true)} />
                    <ActionButton icon={Trash2} label="Clear cart" onClick={resetSale} disabled={cart.length === 0} />
                    <button
                        onClick={goToPayment}
                        disabled={cart.length === 0 || mode === 'payment'}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-4 py-5 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                        <CreditCard className="h-6 w-6" /> PAYMENT
                    </button>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span>Items</span><span>{cart.reduce((n, l) => n + l.quantity, 0)}</span>
                        </div>
                        <div className="mt-2 flex justify-between text-base font-bold">
                            <span>Total</span><span className="text-emerald-600">{formatMoney(total)}</span>
                        </div>
                    </div>
                </aside>
            </div>

            <PosCustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSelect={setCustomer}
            />
        </div>
    );
}

function ActionButton({ icon: Icon, label, onClick, disabled }: { icon: any; label: string; onClick: () => void; disabled?: boolean }) {
    return (
        <button
            onClick={onClick} disabled={disabled}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-700"
        >
            <Icon className="h-5 w-5" /> {label}
        </button>
    );
}

interface CartViewProps {
    search: string; setSearch: (v: string) => void;
    showDropdown: boolean; setShowDropdown: (v: boolean) => void;
    filtered: Sellable[]; addToCart: (s: Sellable) => void;
    cart: CartLine[]; changeQty: (id: string, d: number) => void; removeLine: (id: string) => void;
    subtotal: number; discount: number | ''; setDiscount: (v: number | '') => void; total: number;
}

function CartView(p: CartViewProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="relative border-b border-slate-200 p-4 dark:border-slate-800">
                <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    value={p.search}
                    onChange={(e) => { p.setSearch(e.target.value); p.setShowDropdown(true); }}
                    onFocus={() => p.setShowDropdown(true)}
                    onBlur={() => setTimeout(() => p.setShowDropdown(false), 200)}
                    placeholder="Search products by name or barcode..."
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {p.showDropdown && p.filtered.length > 0 && (
                    <ul className="absolute left-4 right-4 z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
                        {p.filtered.slice(0, 30).map((s) => (
                            <li key={s.productId}>
                                <button
                                    type="button" onMouseDown={() => p.addToCart(s)}
                                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    <span>
                                        <span className="font-medium">{s.productName}</span>
                                        <span className="ml-2 text-xs text-slate-400">{s.category}</span>
                                    </span>
                                    <span className="shrink-0 font-mono text-emerald-600">{formatMoney(s.salePrice)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-semibold">#</th>
                            <th className="px-4 py-3 font-semibold">Name</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Sale Price</th>
                            <th className="px-4 py-3 font-semibold">Our Price</th>
                            <th className="px-4 py-3 font-semibold">Quantity</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3"><span className="sr-only">Remove</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {p.cart.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">Cart is empty. Search and click a product to add it.</td></tr>
                        ) : (
                            p.cart.map((line, index) => (
                                <tr key={line.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium">{line.productName}</td>
                                    <td className="px-4 py-3 text-slate-500">{line.category || '-'}</td>
                                    <td className="px-4 py-3">{formatMoney(line.salePrice)}</td>
                                    <td className="px-4 py-3 text-slate-500">{formatMoney(line.ourPrice)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => p.changeQty(line.productId, -1)} className="rounded-md border border-slate-300 p-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><Minus className="h-3.5 w-3.5" /></button>
                                            <span className="w-6 text-center font-semibold">{line.quantity}</span>
                                            <button onClick={() => p.changeQty(line.productId, 1)} className="rounded-md border border-slate-300 p-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><Plus className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-emerald-600">{formatMoney(line.salePrice * line.quantity)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => p.removeLine(line.productId)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Discount</label>
                    <input
                        type="number" step="0.01" min="0" value={p.discount}
                        onChange={(e) => p.setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0.00"
                        className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>
                <div className="space-y-0.5 text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Subtotal: {formatMoney(p.subtotal)}</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatMoney(p.total)}</p>
                </div>
            </div>
        </div>
    );
}

interface PaymentViewProps {
    cart: CartLine[]; subtotal: number; discountValue: number; total: number;
    paymentMethod: string; setPaymentMethod: (v: string) => void;
    paid: number | ''; setPaid: (v: number | '') => void; change: number;
    customer: Customer | null; addToWallet: boolean; setAddToWallet: (v: boolean) => void;
    walletBalance: number; walletApplied: number; netPayable: number;
    useWallet: boolean; setUseWallet: (v: boolean) => void;
    onCancel: () => void; onComplete: () => void; saving: boolean;
}

function PaymentView(p: PaymentViewProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h3 className="text-lg font-semibold">Payment Processing</h3>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-2">
                <div className="space-y-5">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment Type</p>
                        <div className="grid grid-cols-3 gap-2">
                            {PAYMENT_METHODS.map((m) => {
                                const Icon = m.icon;
                                const active = p.paymentMethod === m.value;
                                return (
                                    <button key={m.value} onClick={() => p.setPaymentMethod(m.value)}
                                        className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                                        <Icon className="h-5 w-5" /> {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950">
                        <p className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Price Summary</p>
                        <div className="mt-2 flex justify-between"><span className="text-slate-500 dark:text-slate-400">Subtotal</span><span>{formatMoney(p.subtotal)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Discount</span><span>{formatMoney(p.discountValue)}</span></div>
                        <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-800"><span>Total</span><span>{formatMoney(p.total)}</span></div>
                        {p.walletApplied > 0 && (
                            <div className="flex justify-between text-emerald-600"><span>Wallet applied</span><span>- {formatMoney(p.walletApplied)}</span></div>
                        )}
                        <div className="mt-1 flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-800"><span>Payable</span><span className="text-emerald-600">{formatMoney(p.netPayable)}</span></div>
                    </div>

                    {p.customer && p.walletBalance > 0 && (
                        <label className="flex items-center gap-3 rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700">
                            <input type="checkbox" checked={p.useWallet}
                                onChange={(e) => p.setUseWallet(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <WalletIcon className="h-4 w-4 text-emerald-600" />
                            <span>Use wallet balance <span className="text-slate-400">({formatMoney(p.walletBalance)} available)</span></span>
                        </label>
                    )}
                </div>

                <div className="space-y-5">
                    <div>
                        <p className="text-lg font-bold text-emerald-600">Payable: {formatMoney(p.netPayable)}</p>
                        <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-200">Paid Amount</label>
                        <input
                            autoFocus type="number" step="0.01" min="0" value={p.paid}
                            onChange={(e) => p.setPaid(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-lg font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Change / Balance: <span className="font-semibold text-slate-800 dark:text-slate-100">{formatMoney(p.change)}</span></p>
                    </div>

                    <label className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${p.customer ? 'border-slate-300 dark:border-slate-700' : 'border-slate-200 opacity-60 dark:border-slate-800'}`}>
                        <input type="checkbox" checked={p.addToWallet} disabled={!p.customer || p.change <= 0}
                            onChange={(e) => p.setAddToWallet(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                        <WalletIcon className="h-4 w-4 text-emerald-600" />
                        <span>
                            Add balance to wallet
                            {!p.customer && <span className="block text-xs text-slate-400">Select a customer first</span>}
                        </span>
                    </label>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Customer: {p.customer?.contact || 'Walk-in (N/A)'}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                <button onClick={p.onCancel} disabled={p.saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800">
                    Back to Cart
                </button>
                <button onClick={p.onComplete} disabled={p.saving}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
                    {p.saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Complete Payment
                </button>
            </div>
        </div>
    );
}

function buildSellables(batches: ProductQuantityBatch[], products: Product[]): Sellable[] {
    const categoryById = new Map<string, string>();
    products.forEach((prod) => {
        const cat = prod.category || prod.categoryName || '';
        if (prod.id) categoryById.set(String(prod.id), cat);
        if (prod.mysqlId) categoryById.set(String(prod.mysqlId), cat);
    });

    const byProduct = new Map<string, Sellable>();
    batches.forEach((b) => {
        const productId = b.productId || b.id || b.mysqlId;
        if (!productId) return;
        const key = String(productId);
        const existing = byProduct.get(key);
        const stock = Number(b.quantity) || 0;
        if (existing) {
            existing.stock += stock;
            // Prefer a batch that actually carries a price.
            if (b.salePrice != null) existing.salePrice = Number(b.salePrice) || 0;
            if (b.ourPrice != null) existing.ourPrice = Number(b.ourPrice) || 0;
            if (!existing.barcode && b.barcode) existing.barcode = b.barcode;
            return;
        }
        byProduct.set(key, {
            productId: key,
            productName: b.productName || 'Unnamed product',
            category: categoryById.get(key) || '',
            barcode: b.barcode,
            salePrice: Number(b.salePrice) || 0,
            ourPrice: Number(b.ourPrice) || 0,
            stock,
        });
    });

    return Array.from(byProduct.values());
}

// Apply a signed change to a customer's wallet balance (negative deducts, positive credits).
async function adjustWallet(customer: Customer, delta: number) {
    const customerId = customer.mysqlId || customer.id;
    const wallets = await walletApi.list();
    const existing = wallets.find((w) => w.customerId === customerId || w.customerContact === customer.contact);

    if (existing && (existing.mysqlId || existing.id)) {
        const newBalance = Math.max(0, (Number(existing.balance) || 0) + delta);
        await walletApi.update(String(existing.mysqlId || existing.id), {
            ...existing,
            balance: newBalance,
        });
        return;
    }

    // No wallet yet — only meaningful when crediting.
    if (delta > 0) {
        await walletApi.create({
            customerId,
            customerContact: customer.contact,
            balance: delta,
        });
    }
}
