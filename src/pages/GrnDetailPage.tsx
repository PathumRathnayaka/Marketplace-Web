import type React from 'react';
import { useCallback } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { StatusMessage } from '../components/StatusMessage';
import { useAsyncData } from '../hooks/useAsyncData';
import { grnApi, productVariationApi } from '../services/api';
import { Grn } from '../types/pos';
import { formatDate, formatDateTime, formatMoney } from '../utils/format';
import { getGrnDetailId, navigate } from '../utils/routing';

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    );
}

export function GrnDetailPage() {
    const grnId = getGrnDetailId();
    const loadGrn = useCallback(async () => {
        if (!grnId) return null;
        try {
            return await grnApi.get(grnId);
        } catch {
            // Fall back to the list endpoint and match locally — the id used in the
            // URL may not be the entity's primary key (e.g. mysqlId / grnCode).
            const all = await grnApi.list();
            return (
                all.find(
                    (g) => g.id === grnId || g.mysqlId === grnId || g.grnCode === grnId
                ) ?? null
            );
        }
    }, [grnId]);

    const { data: grn, loading, error } = useAsyncData<Grn | null>(loadGrn, null);

    // The GRN item only stores variationId; the human-readable variation name lives
    // on the product-variation record. Build a lookup keyed by both id and mysqlId.
    const loadVariations = useCallback(() => productVariationApi.list(), []);
    const { data: variations } = useAsyncData<any[]>(loadVariations, []);

    const variationNameById = new Map<string, string>();
    variations.forEach((v) => {
        if (v.variation) {
            if (v.id) variationNameById.set(String(v.id), v.variation);
            if (v.mysqlId) variationNameById.set(String(v.mysqlId), v.variation);
        }
    });

    const resolveVariation = (item: { variation?: string; variationId?: string }) =>
        item.variation ||
        (item.variationId ? variationNameById.get(String(item.variationId)) : undefined) ||
        '-';

    const items = grn?.items ?? [];

    return (
        <div className="px-5 py-6 sm:px-7 max-w-7xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/grns')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to GRNs
            </button>

            <PageHeader
                title={grn?.grnCode ? `Receipt Note ${grn.grnCode}` : 'Receipt Note (GRN)'}
                description="View the full details of this goods receipt note and its received items."
            />

            {loading && (
                <div className="flex h-44 items-center justify-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading GRN
                </div>
            )}

            {!loading && error && <StatusMessage type="error" message={error} />}

            {!loading && !error && !grn && (
                <StatusMessage type="error" message="GRN not found." />
            )}

            {!loading && !error && grn && (
                <>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">1. GRN Details</h3>
                            <div className="flex items-center gap-2">
                                <StatusBadge value={grn.status} />
                                <StatusBadge value={grn.paymentStatus} />
                            </div>
                        </div>
                        <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <DetailField label="Supplier" value={grn.supplierName || grn.supplierId || '-'} />
                            <DetailField label="GRN Code" value={grn.grnCode || '-'} />
                            <DetailField label="Invoice No" value={grn.invoiceNo || '-'} />
                            <DetailField label="Received Date" value={formatDate(grn.receivedDate)} />
                            <DetailField label="Total Amount" value={formatMoney(grn.totalAmount)} />
                            <DetailField label="Paid Amount" value={formatMoney(grn.paidAmount)} />
                            <DetailField label="Due Amount" value={formatMoney(grn.dueAmount)} />
                            <DetailField label="Created" value={formatDateTime(grn.createdAt)} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">2. Products Received</h3>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="min-w-full divide-y text-left text-sm divide-slate-200 dark:divide-slate-800">
                                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Product</th>
                                        <th className="px-6 py-3 font-medium">Variation</th>
                                        <th className="px-6 py-3 font-medium">Barcode</th>
                                        <th className="px-6 py-3 font-medium">Qty</th>
                                        <th className="px-6 py-3 font-medium">Purchase Price</th>
                                        <th className="px-6 py-3 font-medium shrink-0">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No items on this GRN.</td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => (
                                            <tr key={item.mysqlId || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium">{item.productName}</td>
                                                <td className="px-6 py-4 text-slate-500">{resolveVariation(item)}</td>
                                                <td className="px-6 py-4">{item.barcode || '-'}</td>
                                                <td className="px-6 py-4">{item.quantity}</td>
                                                <td className="px-6 py-4">{formatMoney(item.purchasePrice)}</td>
                                                <td className="px-6 py-4 font-mono text-emerald-600">
                                                    {((item.quantity || 0) * (item.purchasePrice || 0)).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
