import type React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MetricCard({ label, value, note, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <Icon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}
