interface StatusBadgeProps {
  value?: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  if (!value) {
    return <span className="text-slate-400">-</span>;
  }

  const normalized = value.toLowerCase();
  const isPositive =
    normalized.includes('active') ||
    normalized.includes('complete') ||
    normalized.includes('paid') ||
    normalized.includes('cash');

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
        isPositive
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200'
      }`}
    >
      {value}
    </span>
  );
}
