import { useEffect, useState } from 'react';
import { X, Undo2 } from 'lucide-react';

export interface PendingReturnRow {
    returnId: string;
    returnItemId: string;
    productId?: string;
    productName: string;
    variation?: string;
    variationId?: string;
    barcode?: string;
    brand?: string;
    warehouseNo?: string;
    salePrice?: number;
    ourPrice?: number;
    tax?: number;
    discount?: number;
    quantity: number;
    purchasePrice: number;
}

interface PendingSupplierReturnsModalProps {
    isOpen: boolean;
    supplierName: string;
    rows: PendingReturnRow[];
    onClose: () => void;
    onConfirm: (rows: PendingReturnRow[]) => void;
}

export function PendingSupplierReturnsModal({ isOpen, supplierName, rows, onClose, onConfirm }: PendingSupplierReturnsModalProps) {
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [overrides, setOverrides] = useState<Record<string, { quantity: number; purchasePrice: number }>>({});

    useEffect(() => {
        if (isOpen) {
            const initSelected: Record<string, boolean> = {};
            const initOverrides: Record<string, { quantity: number; purchasePrice: number }> = {};
            rows.forEach((r) => {
                initSelected[r.returnItemId] = true;
                initOverrides[r.returnItemId] = { quantity: r.quantity, purchasePrice: r.purchasePrice };
            });
            setSelected(initSelected);
            setOverrides(initOverrides);
        }
    }, [isOpen, rows]);

    if (!isOpen) return null;

    const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

    const setOverride = (id: string, field: 'quantity' | 'purchasePrice', value: number) =>
        setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

    const handleConfirm = () => {
        const picked = rows
            .filter((r) => selected[r.returnItemId])
            .map((r) => ({
                ...r,
                quantity: overrides[r.returnItemId]?.quantity ?? r.quantity,
                purchasePrice: overrides[r.returnItemId]?.purchasePrice ?? r.purchasePrice,
            }));
        onConfirm(picked);
    };

    const selectedCount = Object.values(selected).filter(Boolean).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-50 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pending Returns — {supplierName}</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            This supplier has returned items awaiting replacement. Select which ones this GRN replaces.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-6">
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold"></th>
                                    <th className="px-4 py-3 font-semibold">Product</th>
                                    <th className="px-4 py-3 font-semibold">Variation</th>
                                    <th className="px-4 py-3 font-semibold">Qty</th>
                                    <th className="px-4 py-3 font-semibold">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {rows.map((r) => (
                                    <tr key={r.returnItemId}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={!!selected[r.returnItemId]}
                                                onChange={() => toggle(r.returnItemId)}
                                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium">{r.productName}</td>
                                        <td className="px-4 py-3 text-slate-500">{r.variation || '-'}</td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number" min="0" step="0.001"
                                                disabled={!selected[r.returnItemId]}
                                                value={overrides[r.returnItemId]?.quantity ?? r.quantity}
                                                onChange={(e) => setOverride(r.returnItemId, 'quantity', Number(e.target.value))}
                                                className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number" min="0" step="0.01"
                                                disabled={!selected[r.returnItemId]}
                                                value={overrides[r.returnItemId]?.purchasePrice ?? r.purchasePrice}
                                                onChange={(e) => setOverride(r.returnItemId, 'purchasePrice', Number(e.target.value))}
                                                className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCount} of {rows.length} selected</p>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                            Skip
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={selectedCount === 0}
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                        >
                            <Undo2 className="h-4 w-4" /> Add to GRN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
