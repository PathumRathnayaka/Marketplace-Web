import { useState } from 'react';
import { ArrowLeft, Search, Loader2, CheckCircle2, AlertCircle, Undo2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { salesApi, productReturnApi } from '../services/api';
import { adjustWallet } from '../utils/wallet';
import { Sale, SaleItem } from '../types/pos';
import { formatDateTime, formatMoney } from '../utils/format';
import { navigate } from '../utils/routing';

interface ReturnSelection {
    [saleItemId: string]: { checked: boolean; qty: number };
}

const returnableQty = (item: SaleItem) => (Number(item.quantity) || 0) - (Number(item.returnedQuantity) || 0);

export function RefundPage() {
    const [contact, setContact] = useState('');
    const [sales, setSales] = useState<Sale[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const [activeSale, setActiveSale] = useState<Sale | null>(null);
    const [selection, setSelection] = useState<ReturnSelection>({});

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const search = async () => {
        const trimmed = contact.trim();
        if (!trimmed) return;
        setLoading(true);
        setError(null);
        setSuccess(null);
        setActiveSale(null);
        try {
            const q = trimmed.toLowerCase();
            const all = await salesApi.list();
            // Match by customer contact OR by sale invoice id (saleId / record id).
            const matches = all
                .filter((s) =>
                    (s.customerContact || '') === trimmed ||
                    (s.saleId || '').toLowerCase().includes(q) ||
                    String(s.mysqlId || '').toLowerCase() === q ||
                    String(s.id || '').toLowerCase() === q
                )
                .sort((a, b) => (b.saleDate || '').localeCompare(a.saleDate || ''));
            setSales(matches);
            setSearched(true);
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to load sales');
        } finally {
            setLoading(false);
        }
    };

    const openSale = (sale: Sale) => {
        setError(null);
        setSuccess(null);
        setActiveSale(sale);
        const initial: ReturnSelection = {};
        (sale.saleItems || []).forEach((item) => {
            const id = item.mysqlId;
            if (id) initial[id] = { checked: false, qty: returnableQty(item) };
        });
        setSelection(initial);
    };

    const toggle = (id: string, checked: boolean) =>
        setSelection((prev) => ({ ...prev, [id]: { ...prev[id], checked } }));

    const setQty = (id: string, qty: number) =>
        setSelection((prev) => ({ ...prev, [id]: { ...prev[id], qty } }));

    const selectedItems = (activeSale?.saleItems || []).filter((it) => it.mysqlId && selection[it.mysqlId]?.checked);
    const refundTotal = selectedItems.reduce((sum, it) => {
        const qty = selection[it.mysqlId!]?.qty || 0;
        return sum + qty * (Number(it.unitPrice) || 0);
    }, 0);

    const submitReturn = async () => {
        if (!activeSale) return;
        setError(null);

        const items = selectedItems
            .map((it) => ({ item: it, qty: selection[it.mysqlId!]?.qty || 0 }))
            .filter(({ item, qty }) => qty > 0 && qty <= returnableQty(item));

        if (items.length === 0) {
            setError('Select at least one item with a valid return quantity.');
            return;
        }

        setSaving(true);
        try {
            const returnPayload = {
                returnCode: `RET-${Date.now()}`,
                saleId: activeSale.id || activeSale.mysqlId,
                saleCode: activeSale.saleId,
                customerId: activeSale.customerId,
                customerContact: activeSale.customerContact,
                refundMethod: 'WALLET',
                refundAmount: refundTotal,
                reason: 'Customer return',
                returnItems: items.map(({ item, qty }) => ({
                    productId: item.productId,
                    productName: item.productName,
                    returnedQuantity: qty,
                    unitPrice: item.unitPrice,
                    returnAmount: qty * (Number(item.unitPrice) || 0),
                    saleItemId: item.mysqlId,
                    condition: 'RETURNED',
                    batchId: item.batchId,
                    supplierId: item.supplierId,
                    supplierName: item.supplierName,
                    replacementGrnId: null,
                })),
            };

            await productReturnApi.create(returnPayload);

            // Mark the returned quantities on the original sale so they can't be returned twice.
            const updatedItems = (activeSale.saleItems || []).map((it) => {
                const match = items.find((r) => r.item.mysqlId === it.mysqlId);
                if (!match) return it;
                return { ...it, returnedQuantity: (Number(it.returnedQuantity) || 0) + match.qty };
            });
            const saleId = String(activeSale.id || activeSale.mysqlId);
            await salesApi.update(saleId, { ...activeSale, saleItems: updatedItems });

            // Credit the customer's wallet with the refund amount.
            await adjustWallet(activeSale.customerId, activeSale.customerContact, refundTotal);

            setSuccess(`Returned ${items.length} item(s). ${formatMoney(refundTotal)} added to ${activeSale.customerContact}'s wallet.`);

            // Refresh local state with the updated sale.
            const refreshedSale = { ...activeSale, saleItems: updatedItems };
            setSales((prev) => prev.map((s) => (s === activeSale ? refreshedSale : s)));
            setActiveSale(null);
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to process the return');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-5 py-6 sm:px-7 max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/pos')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
                <ArrowLeft className="h-4 w-4" /> Back to POS
            </button>

            <PageHeader title="Refund / Return" description="Find a customer's sales by contact, then return purchased items to their wallet." />

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" /> {success}
                </div>
            )}

            {/* Customer search */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && search()}
                        placeholder="Customer contact number or sale invoice ID..."
                        className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                </div>
                <button
                    onClick={search}
                    disabled={loading || !contact.trim()}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Find sales
                </button>
            </div>

            {/* Sales list */}
            {searched && !loading && (
                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                        <h3 className="font-semibold">Sales {sales.length > 0 && `(${sales.length})`}</h3>
                    </div>
                    {sales.length === 0 ? (
                        <p className="px-5 py-8 text-center text-sm text-slate-500">No sales found for this contact.</p>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {sales.map((sale) => {
                                const isActive = sale === activeSale;
                                return (
                                    <div key={sale.id || sale.saleId}>
                                        <button
                                            onClick={() => (isActive ? setActiveSale(null) : openSale(sale))}
                                            className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isActive ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                                        >
                                            <div>
                                                <p className="font-semibold">{sale.saleId || sale.mysqlId}</p>
                                                <p className="text-xs text-slate-500">{formatDateTime(sale.saleDate)} · {sale.saleItems?.length ?? 0} item(s)</p>
                                            </div>
                                            <span className="font-mono text-emerald-600">{formatMoney(sale.totalAmount)}</span>
                                        </button>

                                        {isActive && (
                                            <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30">
                                                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                                                        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                                            <tr>
                                                                <th className="px-3 py-2 font-semibold"></th>
                                                                <th className="px-3 py-2 font-semibold">Product</th>
                                                                <th className="px-3 py-2 font-semibold">Batch</th>
                                                                <th className="px-3 py-2 font-semibold">Unit</th>
                                                                <th className="px-3 py-2 font-semibold">Sold</th>
                                                                <th className="px-3 py-2 font-semibold">Returnable</th>
                                                                <th className="px-3 py-2 font-semibold">Return Qty</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                                            {(sale.saleItems || []).map((item, idx) => {
                                                                const id = item.mysqlId || String(idx);
                                                                const max = returnableQty(item);
                                                                const sel = selection[item.mysqlId || ''] || { checked: false, qty: max };
                                                                const disabled = !item.mysqlId || max <= 0;
                                                                return (
                                                                    <tr key={id} className={disabled ? 'opacity-50' : ''}>
                                                                        <td className="px-3 py-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                disabled={disabled}
                                                                                checked={sel.checked}
                                                                                onChange={(e) => item.mysqlId && toggle(item.mysqlId, e.target.checked)}
                                                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-2 font-medium">{item.productName}</td>
                                                                        <td className="px-3 py-2 text-slate-500">{item.batchCode || '-'}</td>
                                                                        <td className="px-3 py-2">{formatMoney(item.unitPrice)}</td>
                                                                        <td className="px-3 py-2">{item.quantity}</td>
                                                                        <td className="px-3 py-2">{max}</td>
                                                                        <td className="px-3 py-2">
                                                                            <input
                                                                                type="number" min="0" max={max} step="0.001"
                                                                                disabled={disabled || !sel.checked}
                                                                                value={sel.qty}
                                                                                onChange={(e) => item.mysqlId && setQty(item.mysqlId, Number(e.target.value))}
                                                                                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between">
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        Refund to wallet: <span className="text-lg font-bold text-emerald-600">{formatMoney(refundTotal)}</span>
                                                    </p>
                                                    <button
                                                        onClick={submitReturn}
                                                        disabled={saving || refundTotal <= 0}
                                                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                                                    >
                                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />} Return selected
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
