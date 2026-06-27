import { useCallback } from 'react';
import { CircleDollarSign, Truck, Plus } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { grnApi } from '../services/api';
import { Grn } from '../types/pos';
import { formatDate, formatDateTime, formatMoney } from '../utils/format';
import { navigate, navigateToGrn } from '../utils/routing';

export function GrnsPage() {
  const loadGrns = useCallback(() => grnApi.list(), []);
  const { data: grns, loading, error } = useAsyncData<Grn[]>(loadGrns, []);
  const total = grns.reduce((sum, grn) => sum + (grn.totalAmount || 0), 0);
  const due = grns.reduce((sum, grn) => sum + (grn.dueAmount || 0), 0);

  return (
    <div className="px-5 py-6 sm:px-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="[&>div]:mb-6">
          <PageHeader
            title="Goods receipt notes"
            description="Read supplier receipts, payment status, invoice numbers, totals, and received stock item counts."
          />
        </div>
        <button
          onClick={() => navigate('/grns/create')}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Create GRN
        </button>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="GRNs" value={grns.length.toString()} icon={Truck} />
        <MetricCard label="Total received" value={formatMoney(total)} icon={CircleDollarSign} />
        <MetricCard label="Due amount" value={formatMoney(due)} icon={CircleDollarSign} />
      </div>
      <DataTable
        title="GRN records"
        data={grns}
        loading={loading}
        error={error}
        emptyMessage="No GRNs found"
        getRowKey={(grn, index) => grn.id || grn.grnCode || index.toString()}
        onRowClick={(grn) => {
          const id = grn.id || grn.mysqlId || grn.grnCode;
          if (id) navigateToGrn(id);
        }}
        columns={[
          { key: 'code', header: 'GRN', render: (grn) => grn.grnCode || grn.mysqlId || '-' },
          { key: 'supplier', header: 'Supplier', render: (grn) => grn.supplierName || grn.supplierId || '-' },
          { key: 'invoice', header: 'Invoice', render: (grn) => grn.invoiceNo || '-' },
          { key: 'items', header: 'Items', render: (grn) => grn.items?.length ?? 0 },
          { key: 'total', header: 'Total', render: (grn) => formatMoney(grn.totalAmount) },
          { key: 'due', header: 'Due', render: (grn) => formatMoney(grn.dueAmount) },
          { key: 'status', header: 'Status', render: (grn) => <StatusBadge value={grn.status} /> },
          { key: 'payment', header: 'Payment', render: (grn) => <StatusBadge value={grn.paymentStatus} /> },
          { key: 'received', header: 'Received', render: (grn) => formatDate(grn.receivedDate) },
          { key: 'created', header: 'Created', render: (grn) => formatDateTime(grn.createdAt) },
        ]}
      />
    </div>
  );
}
