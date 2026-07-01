import { useEffect, useState } from 'react';
import { X, Loader2, Undo2 } from 'lucide-react';

interface ReturnReasonModalProps {
    isOpen: boolean;
    saving: boolean;
    refundAmount: string;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const RETURN_REASONS = ['Damaged', 'Expired', 'Defective', 'Wrong Item', 'Customer Changed Mind', 'Other'];

export function ReturnReasonModal({ isOpen, saving, refundAmount, onClose, onConfirm }: ReturnReasonModalProps) {
    const [reason, setReason] = useState(RETURN_REASONS[0]);

    useEffect(() => {
        if (isOpen) setReason(RETURN_REASONS[0]);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={saving ? undefined : onClose} />

            <div className="relative z-[70] w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Return Reason</h3>
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Why is this being returned?</label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            {RETURN_REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Refund to wallet: <span className="font-bold text-emerald-600">{refundAmount}</span>
                    </p>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(reason)}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />} Confirm Return
                    </button>
                </div>
            </div>
        </div>
    );
}
