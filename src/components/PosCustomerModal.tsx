import React, { useEffect, useState } from 'react';
import { X, Loader2, UserCheck, UserPlus } from 'lucide-react';
import { customerApi } from '../services/api';
import { Customer } from '../types/pos';

interface PosCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export function PosCustomerModal({ isOpen, onClose, onSelect }: PosCustomerModalProps) {
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setContact('');
            setEmail('');
            setError(null);
            customerApi.list().then(setCustomers).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const trimmed = contact.trim();
    const matches = trimmed
        ? customers.filter((c) => (c.contact || '').toLowerCase().includes(trimmed.toLowerCase()))
        : customers;

    const exactMatch = customers.find((c) => (c.contact || '') === trimmed);

    const handleSelectExisting = (customer: Customer) => {
        onSelect(customer);
        onClose();
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trimmed) return;

        // Re-use the existing record if the contact already exists.
        if (exactMatch) {
            handleSelectExisting(exactMatch);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res: any = await customerApi.create({ contact: trimmed, email: email.trim() || undefined });
            const created = (res?.data || res) as Customer;
            onSelect(created);
            onClose();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative z-[60] flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Select Customer</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Match an existing customer by contact, or add a new one.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 px-6 py-6">
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Contact</label>
                            <input
                                required autoFocus name="contact" value={contact} onChange={(e) => setContact(e.target.value)}
                                type="text" placeholder="07XXXXXXXX"
                                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email (optional)</label>
                            <input
                                name="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                type="email" placeholder="name@email.com"
                                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {trimmed && matches.length > 0 && (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800">
                            <p className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                Existing matches
                            </p>
                            <ul className="max-h-48 overflow-auto">
                                {matches.slice(0, 25).map((c) => (
                                    <li key={c.id || c.mysqlId || c.contact}>
                                        <button
                                            type="button" onClick={() => handleSelectExisting(c)}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <UserCheck className="h-4 w-4 text-emerald-600" />
                                            <span className="font-medium">{c.contact}</span>
                                            {c.email && <span className="text-slate-400">· {c.email}</span>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <button type="button" onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || !trimmed} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : exactMatch ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                            {exactMatch ? 'Use this customer' : 'Add & select'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
