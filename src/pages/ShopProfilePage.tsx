import React, { useEffect, useState } from 'react';
import { Loader2, Store } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { shopProfileApi } from '../services/api';
import { ShopProfile } from '../types/orders';

// The shop's public-facing contact card, saved in supplier-service so authorized
// (marketplace) suppliers can see who placed an Order GRN and reach the shop.
export function ShopProfilePage() {
    const [form, setForm] = useState<ShopProfile>({
        shopName: '',
        ownerName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        district: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let active = true;
        shopProfileApi
            .getMine()
            .then((data) => {
                if (active && data) {
                    setForm({
                        shopName: data.shopName || '',
                        ownerName: data.ownerName || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        address: data.address || '',
                        city: data.city || '',
                        district: data.district || '',
                    });
                }
            })
            .catch((err) => {
                if (active) setError(err instanceof Error ? err.message : 'Failed to load shop profile.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setSaved(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.shopName.trim()) {
            setError('Shop name is required.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await shopProfileApi.upsert(form);
            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save shop profile.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-5 py-6 sm:px-7 max-w-3xl mx-auto space-y-6">
            <PageHeader
                title="Shop Profile"
                description="Your shop's contact details. Authorized suppliers see this when you place an Order GRN, so they know where to deliver and how to reach you."
            />

            {loading ? (
                <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
                            <Store className="h-6 w-6" />
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">Contact details</p>
                    </div>

                    {error ? (
                        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                            {error}
                        </div>
                    ) : null}
                    {saved ? (
                        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Shop profile saved.
                        </div>
                    ) : null}

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Shop Name" name="shopName" value={form.shopName} onChange={handleChange} required className="sm:col-span-2" />
                        <Field label="Owner Name" name="ownerName" value={form.ownerName || ''} onChange={handleChange} />
                        <Field label="Phone" name="phone" value={form.phone || ''} onChange={handleChange} />
                        <Field label="Email" name="email" type="email" value={form.email || ''} onChange={handleChange} />
                        <Field label="City" name="city" value={form.city || ''} onChange={handleChange} />
                        <Field label="District" name="district" value={form.district || ''} onChange={handleChange} />
                        <Field label="Address" name="address" value={form.address || ''} onChange={handleChange} className="sm:col-span-2" />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save profile
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    type = 'text',
    required = false,
    className = '',
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    className?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
        </div>
    );
}
