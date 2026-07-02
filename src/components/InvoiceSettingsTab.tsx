import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { invoiceSettingsApi } from '../services/api';
import { InvoiceSettings } from '../types/pos';

const LANGUAGES: { code: 'EN' | 'SI'; label: string }[] = [
    { code: 'EN', label: 'English' },
    { code: 'SI', label: 'Sinhala' },
];

const emptyForm = {
    shopName: '',
    slogan: '',
    address: '',
    tel: '',
    email: '',
    footerMessage: '',
};

export function InvoiceSettingsTab() {
    const [language, setLanguage] = useState<'EN' | 'SI'>('EN');
    const [rows, setRows] = useState<InvoiceSettings[]>([]);
    const [form, setForm] = useState(emptyForm);
    const [isActive, setIsActive] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        invoiceSettingsApi.list()
            .then(setRows)
            .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load invoice settings'))
            .finally(() => setLoading(false));
    }, []);

    // Load the selected language's saved row (if any) into the form whenever the
    // language tab or the underlying data changes.
    useEffect(() => {
        const row = rows.find((r) => r.language === language);
        if (row) {
            setForm({
                shopName: row.shopName || '',
                slogan: row.slogan || '',
                address: row.address || '',
                tel: row.tel || '',
                email: row.email || '',
                footerMessage: row.footerMessage || '',
            });
            setIsActive(!!row.isActive);
        } else {
            setForm(emptyForm);
            setIsActive(false);
        }
    }, [language, rows]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const existing = rows.find((r) => r.language === language);
            const payload: Partial<InvoiceSettings> = { ...existing, ...form, language, isActive };

            let saved: InvoiceSettings;
            if (existing && (existing.id || existing.mysqlId)) {
                const res: any = await invoiceSettingsApi.update(String(existing.id || existing.mysqlId), payload);
                saved = (res?.data || res) as InvoiceSettings;
            } else {
                const res: any = await invoiceSettingsApi.create(payload);
                saved = (res?.data || res) as InvoiceSettings;
            }

            let nextRows = rows.filter((r) => r.language !== language);
            nextRows = [...nextRows, saved];

            // Only one language may be active at a time — deactivate the other row.
            if (isActive) {
                const other = nextRows.find((r) => r.language !== language && r.isActive);
                if (other && (other.id || other.mysqlId)) {
                    const otherRes: any = await invoiceSettingsApi.update(String(other.id || other.mysqlId), { ...other, isActive: false });
                    const otherSaved = (otherRes?.data || otherRes) as InvoiceSettings;
                    nextRows = nextRows.map((r) => (r === other ? otherSaved : r));
                }
            }

            setRows(nextRows);
            setSuccess('Invoice settings saved.');
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to save invoice settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center text-slate-500 dark:text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                {LANGUAGES.map((lang) => {
                    const active = lang.code === language;
                    const hasRow = rows.some((r) => r.language === lang.code);
                    return (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${active
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                        >
                            {lang.label}
                            {hasRow && rows.find((r) => r.language === lang.code)?.isActive && (
                                <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                            )}
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>
            )}
            {success && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" /> {success}
                </div>
            )}

            <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Shop Name</label>
                        <input
                            required name="shopName" value={form.shopName} onChange={handleChange} type="text"
                            placeholder={language === 'SI' ? 'උදා:  තොග කඩේ' : 'e.g. Qal POS'}
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Slogan</label>
                        <input
                            name="slogan" value={form.slogan} onChange={handleChange} type="text"
                            placeholder={language === 'SI' ? 'උදා: උසස් තත්ත්වයේ නිෂ්පාදන, හොඳම මිලට' : 'e.g. Quality products, best price'}
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Address</label>
                        <input
                            name="address" value={form.address} onChange={handleChange} type="text"
                            placeholder="e.g. 123 Main Street"
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Tel</label>
                        <input
                            name="tel" value={form.tel} onChange={handleChange} type="text"
                            placeholder="e.g. 011-2345678"
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                        <input
                            name="email" value={form.email} onChange={handleChange} type="email"
                            placeholder="shop@email.com"
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Footer Message</label>
                        <textarea
                            name="footerMessage" value={form.footerMessage} onChange={handleChange} rows={2}
                            placeholder={language === 'SI' ? 'ස්තූතියි!, නැවත එන්න!' : 'Thank you for your business!\nPlease come again!'}
                            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <p className="text-xs text-slate-400">One line per printed line — press Enter for a new line.</p>
                    </div>
                </div>

                <label className="mt-6 flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <input
                        type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                        Use {LANGUAGES.find((l) => l.code === language)?.label} on printed receipts
                        <span className="block text-xs text-slate-400">Only one language can be active at a time.</span>
                    </span>
                </label>

                <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
                    <button
                        type="submit" disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save {LANGUAGES.find((l) => l.code === language)?.label} Settings
                    </button>
                </div>
            </form>
        </div>
    );
}
