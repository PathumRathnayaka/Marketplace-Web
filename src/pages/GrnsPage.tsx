import { useCallback } from 'react';
import { CircleDollarSign, Truck } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { grnApi } from '../services/api';
import { Grn } from '../types/pos';
import { formatDate, formatDateTime, formatMoney } from '../utils/format';

export function GrnsPage() {
  const loadGrns = useCallback(() => grnApi.list(), []);
  const { data: grns, loading, error } = useAsyncData<Grn[]>(loadGrns, []);
  const total = grns.reduce((sum, grn) => sum + (grn.totalAmount || 0), 0);
  const due = grns.reduce((sum, grn) => sum + (grn.dueAmount || 0), 0);

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Goods receipt notes"
        description="Read supplier receipts, payment status, invoice numbers, totals, and received stock item counts."
      />
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
