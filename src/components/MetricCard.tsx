import type React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MetricCard({ label, value, note, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:translate-y-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
          <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}
