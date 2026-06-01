import type React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { StatusMessage } from './StatusMessage';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  error: string;
  emptyMessage: string;
  getRowKey: (item: T, index: number) => string;
}

export function DataTable<T>({
  title,
  description,
  columns,
  data,
  loading,
  error,
  emptyMessage,
  getRowKey,
}: DataTableProps<T>) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>

      <div className="p-5">
        {loading && (
          <div className="flex h-44 items-center justify-center text-slate-500 dark:text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading data
          </div>
        )}

        {!loading && error && <StatusMessage type="error" message={error} />}

        {!loading && !error && data.length === 0 && (
          <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 text-center dark:border-slate-700">
            <AlertCircle className="mb-3 h-6 w-6 text-slate-400" />
            <p className="font-medium">{emptyMessage}</p>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.map((item, index) => (
                  <tr key={getRowKey(item, index)} className="align-top">
                    {columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-4 py-3">
                        {column.render(item, index)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
