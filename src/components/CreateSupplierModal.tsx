import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supplierApi } from '../services/api';

interface CreateSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateSupplierModal({ isOpen, onClose, onSuccess }: CreateSupplierModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        address: '',
        supplierSource: 'LOCAL',
        phone: '',
        representativeName: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await supplierApi.create(formData);
            onSuccess();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to create supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative z-50 w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 sm:my-8 sm:p-8">
                <div className="absolute right-4 top-4">
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Create new supplier
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Add a new supplier to your POS system manually.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                type="text"
                                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                placeholder="e.g. Wijaya Traders"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Source</label>
                            <select
                                name="supplierSource"
                                value={formData.supplierSource}
                                onChange={handleChange}
                                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                <option value="LOCAL">LOCAL</option>
                                <option value="IMPORTED">IMPORTED</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                type="text"
                                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                placeholder="076XXXXXXX"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Optional Contact</label>
                            <input
                                name="contact"
                                value={formData.contact}
                                onChange={handleChange}
                                type="text"
                                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                placeholder="Additional contact"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</label>
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="Jagath@gmail.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Physical Address</label>
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            type="text"
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="e.g. Gampaha"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Representative Name</label>
                        <input
                            name="representativeName"
                            value={formData.representativeName}
                            onChange={handleChange}
                            type="text"
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="e.g. Jagath"
                        />
                    </div>

                    <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save supplier
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
