import { useEffect, useState } from 'react';
import { X, Delete, Check } from 'lucide-react';

interface NumberPadModalProps {
    isOpen: boolean;
    title?: string;
    initialValue?: number;
    onClose: () => void;
    onSubmit: (value: number) => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

export function NumberPadModal({ isOpen, title = 'Enter Quantity', initialValue, onClose, onSubmit }: NumberPadModalProps) {
    const [entry, setEntry] = useState('');

    useEffect(() => {
        if (isOpen) setEntry(initialValue != null ? String(initialValue) : '');
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const press = (ch: string) => {
        setEntry((prev) => {
            if (ch === '.') {
                if (prev.includes('.')) return prev;
                return prev === '' ? '0.' : prev + '.';
            }
            // Avoid leading zeros like "00".
            if (prev === '0') return ch;
            return prev + ch;
        });
    };

    const backspace = () => setEntry((prev) => prev.slice(0, -1));
    const clear = () => setEntry('');

    const submit = () => {
        const value = parseFloat(entry);
        if (!Number.isNaN(value) && value > 0) {
            onSubmit(value);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-[70] w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="mb-4 flex h-16 items-center justify-end rounded-lg border border-slate-200 bg-slate-50 px-4 text-3xl font-bold tabular-nums dark:border-slate-700 dark:bg-slate-950">
                        {entry || '0'}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {KEYS.map((k) => (
                            <button key={k} type="button" onClick={() => press(k)}
                                className="h-16 rounded-lg border border-slate-200 bg-white text-2xl font-semibold text-slate-800 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                                {k}
                            </button>
                        ))}
                        <button type="button" onClick={backspace}
                            className="flex h-16 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                            <Delete className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button type="button" onClick={clear}
                            className="h-14 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                            Clear
                        </button>
                        <button type="button" onClick={submit} disabled={!entry || parseFloat(entry) <= 0}
                            className="flex h-14 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
                            <Check className="h-5 w-5" /> Enter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
