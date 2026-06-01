import { useCallback } from 'react';
import { Boxes, CircleDollarSign, CreditCard, ReceiptText, Truck, Users } from 'lucide-react';
import {
  customerApi,
  grnApi,
  inventoryApi,
  productApi,
  salesApi,
  walletApi,
} from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { MetricCard } from '../components/MetricCard';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { LoginData } from '../types/auth';
import { Customer, Grn, Product, ProductQuantityBatch, Sale, Wallet } from '../types/pos';
import { formatDate, formatDateTime, formatMoney } from '../utils/format';

interface DashboardPageProps {
  auth: LoginData;
}

interface OverviewData {
  products: Product[];
  sales: Sale[];
  grns: Grn[];
  wallets: Wallet[];
  batches: ProductQuantityBatch[];
  customers: Customer[];
}

const emptyOverview: OverviewData = {
  products: [],
  sales: [],
  grns: [],
  wallets: [],
  batches: [],
  customers: [],
};

export function DashboardPage({ auth }: DashboardPageProps) {
  const loadOverview = useCallback(async () => {
    const [products, sales, grns, wallets, batches, customers] = await Promise.all([
      productApi.list(),
      salesApi.list(),
      grnApi.list(),
      walletApi.list(),
      inventoryApi.listBatches(),
      customerApi.list(),
    ]);

    return { products, sales, grns, wallets, batches, customers };
  }, []);

  const { data, loading, error } = useAsyncData(loadOverview, emptyOverview);
  const today = new Date().toISOString().slice(0, 10);
  const salesToday = data.sales.filter((sale) => sale.saleDate?.startsWith(today));
  const salesTotal = data.sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const dueTotal = data.grns.reduce((sum, grn) => sum + (grn.dueAmount || 0), 0);
  const walletBalance = data.wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
  const lowStock = data.batches.filter((batch) => (batch.quantity || 0) <= 10).length;

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Shop overview"
        description="Read-only snapshot of products, sales, GRNs, wallets, stock batches, and customers for the active tenant."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Products" value={data.products.length.toString()} icon={Boxes} />
        <MetricCard
          label="Total sales"
          value={formatMoney(salesTotal)}
          note={`${salesToday.length} sale records today`}
          icon={CircleDollarSign}
        />
        <MetricCard label="Customers" value={data.customers.length.toString()} icon={Users} />
        <MetricCard
          label="GRN due"
          value={formatMoney(dueTotal)}
          note={`${data.grns.length} receipt notes`}
          icon={Truck}
        />
        <MetricCard
          label="Wallet balance"
          value={formatMoney(walletBalance)}
          note={`${data.wallets.length} wallets`}
          icon={CreditCard}
        />
        <MetricCard
          label="Low stock batches"
          value={lowStock.toString()}
          note="Quantity 10 or below"
          icon={ReceiptText}
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <DataTable
          title="Recent sales"
          description="Latest sale records returned by the POS service."
          data={data.sales.slice(0, 8)}
          loading={loading}
          error={error}
          emptyMessage="No sales found"
          getRowKey={(sale, index) => sale.id || sale.saleId || index.toString()}
          columns={[
            { key: 'saleId', header: 'Sale', render: (sale) => sale.saleId || sale.mysqlId || '-' },
            { key: 'cashier', header: 'Cashier', render: (sale) => sale.cashierName || '-' },
            { key: 'payment', header: 'Payment', render: (sale) => <StatusBadge value={sale.paymentMethod} /> },
            { key: 'total', header: 'Total', render: (sale) => formatMoney(sale.totalAmount) },
            { key: 'date', header: 'Date', render: (sale) => formatDateTime(sale.saleDate) },
          ]}
        />

        <aside className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold">Tenant session</h3>
          <div className="mt-4 space-y-4 text-sm">
            <Detail label="Email" value={auth.user.email} />
            <Detail label="Role" value={auth.user.role} />
            <Detail label="Tenant ID" value={auth.user.tenantId} />
            <Detail label="Verified" value={auth.user.isVerified ? 'Yes' : 'No'} />
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
            <h4 className="font-semibold">Stock attention</h4>
            <div className="mt-3 space-y-3 text-sm">
              {data.batches.slice(0, 4).map((batch, index) => (
                <div
                  key={batch.id || batch.batchCode || index}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{batch.productName || '-'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Exp {formatDate(batch.expireDate)}
                    </p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold dark:bg-slate-800">
                    {batch.quantity ?? 0}
                  </span>
                </div>
              ))}
              {!loading && data.batches.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400">No inventory batches found.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
