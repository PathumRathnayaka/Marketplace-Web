import { useEffect, useState } from 'react';
import { X, Loader2, Star, AlertCircle } from 'lucide-react';
import { inventoryApi } from '../services/api';
import { Product, ProductQuantityBatch } from '../types/pos';
import { formatDate, formatMoney } from '../utils/format';

interface ProductBatchesModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
}

// Marked (sell-first) batches on top, then FIFO by expiry date.
function sortBatches(batches: ProductQuantityBatch[]): ProductQuantityBatch[] {
    return [...batches].sort((a, b) => {
        const pa = a.salePriority ?? Infinity;
        const pb = b.salePriority ?? Infinity;
        if (pa !== pb) return pa - pb;
        const ea = a.expireDate ? new Date(a.expireDate).getTime() : Infinity;
        const eb = b.expireDate ? new Date(b.expireDate).getTime() : Infinity;
        return ea - eb;
    });
}

export function ProductBatchesModal({ isOpen, product, onClose }: ProductBatchesModalProps) {
    const [batches, setBatches] = useState<ProductQuantityBatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !product) return;
        const productKey = String(product.mysqlId || product.id);
        setLoading(true);
        setError(null);
        inventoryApi.listBatches()
            .then((all) => setBatches(sortBatches(all.filter((b) => String(b.productId) === productKey))))
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load batches'))
            .finally(() => setLoading(false));
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const toggleSellFirst = async (batch: ProductQuantityBatch) => {
        const batchId = String(batch.id || batch.mysqlId);
        const nextPriority = batch.salePriority != null ? null : 1;
        setSavingId(batchId);
        setError(null);
        try {
            // Update writes the whole batch back, so send all existing fields plus the new flag.
            await inventoryApi.updateBatch(batchId, { ...batch, salePriority: nextPriority });
            setBatches((prev) =>
                sortBatches(prev.map((b) => (b === batch ? { ...b, salePriority: nextPriority } : b)))
            );
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to update batch');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-50 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Batches — {product.name}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Mark a batch to sell first. Unmarked batches follow FIFO (earliest expiry first).
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-6">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex h-40 items-center justify-center text-slate-500">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading batches
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-slate-500 dark:border-slate-700">
                            <AlertCircle className="mb-2 h-6 w-6 text-slate-400" />
                            No batches found for this product.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Batch</th>
                                        <th className="px-4 py-3 font-semibold">Supplier</th>
                                        <th className="px-4 py-3 font-semibold">Qty</th>
                                        <th className="px-4 py-3 font-semibold">Sale Price</th>
                                        <th className="px-4 py-3 font-semibold">Expiry</th>
                                        <th className="px-4 py-3 font-semibold text-right">Sell first</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {batches.map((b) => {
                                        const batchId = String(b.id || b.mysqlId);
                                        const marked = b.salePriority != null;
                                        return (
                                            <tr key={batchId} className={marked ? 'bg-emerald-50/60 dark:bg-emerald-950/30' : ''}>
                                                <td className="px-4 py-3 font-medium">{b.batchCode || '-'}</td>
                                                <td className="px-4 py-3 text-slate-500">{b.supplierName || '-'}</td>
                                                <td className="px-4 py-3">{b.quantity ?? '-'}</td>
                                                <td className="px-4 py-3">{formatMoney(b.salePrice)}</td>
                                                <td className="px-4 py-3">{formatDate(b.expireDate)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSellFirst(b)}
                                                        disabled={savingId === batchId}
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${marked
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                                            : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                                    >
                                                        {savingId === batchId
                                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            : <Star className={`h-3.5 w-3.5 ${marked ? 'fill-current' : ''}`} />}
                                                        {marked ? 'Sell first' : 'Mark'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <button type="button" onClick={onClose} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
