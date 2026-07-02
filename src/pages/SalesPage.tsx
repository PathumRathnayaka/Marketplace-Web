import { useCallback } from 'react';
import { CircleDollarSign, ReceiptText } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { salesApi } from '../services/api';
import { Sale } from '../types/pos';
import { formatDateTime, formatMoney } from '../utils/format';

export function SalesPage() {
  const loadSales = useCallback(() => salesApi.list(), []);
  const { data: sales, loading, error } = useAsyncData<Sale[]>(loadSales, []);
  const total = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const discounts = sales.reduce((sum, sale) => sum + (sale.discountAmount || 0), 0);

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Sales"
        description="Read sales invoices, cashier details, payment methods, totals, and item counts."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Sale records" value={sales.length.toString()} icon={ReceiptText} />
        <MetricCard label="Revenue" value={formatMoney(total)} icon={CircleDollarSign} />
        <MetricCard label="Discounts" value={formatMoney(discounts)} icon={CircleDollarSign} />
      </div>
      <DataTable
        title="Sale records"
        data={sales}
        loading={loading}
        error={error}
        emptyMessage="No sales found"
        getRowKey={(sale, index) => sale.id || sale.saleId || index.toString()}
        sortDescendingBy={(sale) => sale.saleDate}
        columns={[
          { key: 'saleId', header: 'Invoice', render: (sale) => sale.saleId || sale.mysqlId || '-' },
          { key: 'customer', header: 'Customer', render: (sale) => sale.customerContact || sale.customerId || '-' },
          { key: 'cashier', header: 'Cashier', render: (sale) => sale.cashierName || sale.cashierId || '-' },
          { key: 'items', header: 'Items', render: (sale) => sale.saleItems?.length ?? 0 },
          { key: 'payment', header: 'Payment', render: (sale) => <StatusBadge value={sale.paymentMethod} /> },
          { key: 'total', header: 'Total', render: (sale) => formatMoney(sale.totalAmount) },
          { key: 'paid', header: 'Paid', render: (sale) => formatMoney(sale.paidAmount) },
          { key: 'date', header: 'Date', render: (sale) => formatDateTime(sale.saleDate) },
        ]}
      />
    </div>
  );
}
