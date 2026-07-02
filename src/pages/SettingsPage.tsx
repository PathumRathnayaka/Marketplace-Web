import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { InvoiceSettingsTab } from '../components/InvoiceSettingsTab';

// Extensible tab shell — add more entries here as more settings categories are built.
const TABS = [
    { key: 'invoice', label: 'Invoice Settings', icon: Receipt },
] as const;

type TabKey = typeof TABS[number]['key'];

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('invoice');

    return (
        <div className="px-5 py-6 sm:px-7 max-w-5xl mx-auto space-y-6">
            <PageHeader title="Settings" description="Configure your shop's POS behavior and receipt details." />

            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = tab.key === activeTab;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${active
                                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                                }`}
                        >
                            <Icon className="h-4 w-4" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'invoice' && <InvoiceSettingsTab />}
        </div>
    );
}
