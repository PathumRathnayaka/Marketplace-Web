import { useCallback } from 'react';
import { Link, Store, UserRoundCheck, Users } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { supplierApi } from '../services/api';
import { Supplier } from '../types/pos';
import { formatDateTime } from '../utils/format';

export function SuppliersPage() {
  const loadSuppliers = useCallback(() => supplierApi.list(), []);
  const { data: suppliers, loading, error } = useAsyncData<Supplier[]>(loadSuppliers, []);
  const marketplaceConnected = suppliers.filter((supplier) => supplier.marketplaceConnected).length;
  const localSuppliers = suppliers.filter(
    (supplier) => (supplier.supplierSource || 'LOCAL').toUpperCase() === 'LOCAL'
  ).length;

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Suppliers"
        description="Read supplier profiles, contacts, representatives, source, and marketplace connection state for this tenant."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Suppliers" value={suppliers.length.toString()} icon={Users} />
        <MetricCard label="Local suppliers" value={localSuppliers.toString()} icon={Store} />
        <MetricCard
          label="Marketplace linked"
          value={marketplaceConnected.toString()}
          icon={Link}
        />
      </div>

      <DataTable
        title="Supplier list"
        data={suppliers}
        loading={loading}
        error={error}
        emptyMessage="No suppliers found"
        getRowKey={(supplier, index) => supplier.id || supplier.mysqlId || index.toString()}
        columns={[
          { key: 'code', header: 'Code', render: (supplier) => supplier.mysqlId || '-' },
          { key: 'name', header: 'Name', render: (supplier) => supplier.name || '-' },
          {
            key: 'representative',
            header: 'Representative',
            render: (supplier) => supplier.representativeName || '-',
          },
          {
            key: 'contact',
            header: 'Contact',
            render: (supplier) => supplier.phone || supplier.contact || '-',
          },
          { key: 'email', header: 'Email', render: (supplier) => supplier.email || '-' },
          {
            key: 'source',
            header: 'Source',
            render: (supplier) => <StatusBadge value={supplier.supplierSource || 'LOCAL'} />,
          },
          {
            key: 'marketplace',
            header: 'Marketplace',
            render: (supplier) => (
              <StatusBadge value={supplier.marketplaceConnected ? 'CONNECTED' : 'NOT CONNECTED'} />
            ),
          },
          {
            key: 'marketplaceId',
            header: 'Marketplace ID',
            render: (supplier) => supplier.marketplaceSupplierId || '-',
          },
          {
            key: 'created',
            header: 'Created',
            render: (supplier) => formatDateTime(supplier.createdDate),
          },
        ]}
      />

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            <UserRoundCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Supplier details are read-only</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add, edit, delete, and marketplace connect actions can be added later with the POS
              operation interface.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
