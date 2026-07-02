import { useMemo, useState } from 'react';
import { Sale } from '../types/pos';
import { formatMoney } from '../utils/format';

interface WeeklySalesChartProps {
  sales: Sale[];
}

interface DayBucket {
  key: string;
  label: string;
  count: number;
  total: number;
}

function buildWeeklyBuckets(sales: Sale[]): DayBucket[] {
  const buckets: DayBucket[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat('en-LK', { weekday: 'short' }).format(date);
    buckets.push({ key, label, count: 0, total: 0 });
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const sale of sales) {
    const key = sale.saleDate?.slice(0, 10);
    if (!key) continue;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.total += sale.totalAmount || 0;
    }
  }

  return buckets;
}

export function WeeklySalesChart({ sales }: WeeklySalesChartProps) {
  const buckets = useMemo(() => buildWeeklyBuckets(sales), [sales]);
  const [hovered, setHovered] = useState<string | null>(null);

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const ticks = [0, Math.round(maxCount / 2), maxCount];
  const weekTotal = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const peakKey = buckets.reduce(
    (peak, bucket) => (bucket.count > (peak?.count ?? -1) ? bucket : peak),
    null as DayBucket | null,
  )?.key;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Weekly sales</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sale records per day, last 7 days</p>
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{weekTotal} total</p>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex h-40 flex-col justify-between text-right text-xs tabular-nums text-slate-400 dark:text-slate-500">
          {ticks
            .slice()
            .reverse()
            .map((tick, index) => (
              <span key={index}>{tick}</span>
            ))}
        </div>

        <div className="relative flex h-40 flex-1 items-end">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {ticks.map((_, index) => (
              <div key={index} className="border-t border-slate-100 dark:border-slate-800" />
            ))}
          </div>

          <div className="relative flex h-full flex-1 items-end justify-between gap-2 px-1">
            {buckets.map((bucket) => {
              const heightPct = maxCount > 0 ? Math.max((bucket.count / maxCount) * 100, bucket.count > 0 ? 4 : 0) : 0;
              const isHovered = hovered === bucket.key;
              const isPeak = bucket.key === peakKey && bucket.count > 0;

              return (
                <div
                  key={bucket.key}
                  className="relative flex h-full flex-1 flex-col items-center justify-end"
                  onMouseEnter={() => setHovered(bucket.key)}
                  onMouseLeave={() => setHovered((current) => (current === bucket.key ? null : current))}
                >
                  {isHovered && (
                    <div className="absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      <p className="font-semibold">{bucket.count} sales</p>
                      <p className="text-slate-500 dark:text-slate-400">{formatMoney(bucket.total)}</p>
                    </div>
                  )}
                  {isPeak && (
                    <span className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {bucket.count}
                    </span>
                  )}
                  <div
                    className={`w-full max-w-[24px] rounded-t-[4px] transition-colors ${
                      isHovered
                        ? 'bg-emerald-700 dark:bg-emerald-400'
                        : 'bg-emerald-600 dark:bg-emerald-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <div className="w-8 shrink-0" />
        <div className="flex flex-1 justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
          {buckets.map((bucket) => (
            <span key={bucket.key} className="flex-1 text-center">
              {bucket.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
