import { useCallback } from 'react';
import { CreditCard, Users } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { walletApi } from '../services/api';
import { Wallet } from '../types/pos';
import { formatDateTime, formatMoney } from '../utils/format';

export function WalletsPage() {
  const loadWallets = useCallback(() => walletApi.list(), []);
  const { data: wallets, loading, error } = useAsyncData<Wallet[]>(loadWallets, []);
  const balance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Wallets"
        description="Read customer wallet balances and last update timestamps."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <MetricCard label="Wallets" value={wallets.length.toString()} icon={Users} />
        <MetricCard label="Total balance" value={formatMoney(balance)} icon={CreditCard} />
      </div>
      <DataTable
        title="Wallet list"
        data={wallets}
        loading={loading}
        error={error}
        emptyMessage="No wallets found"
        getRowKey={(wallet, index) => wallet.id || wallet.mysqlId || index.toString()}
        columns={[
          { key: 'code', header: 'Code', render: (wallet) => wallet.mysqlId || '-' },
          { key: 'customer', header: 'Customer', render: (wallet) => wallet.customerContact || wallet.customerId || '-' },
          { key: 'balance', header: 'Balance', render: (wallet) => formatMoney(wallet.balance) },
          { key: 'updated', header: 'Last updated', render: (wallet) => formatDateTime(wallet.lastUpdated) },
          { key: 'created', header: 'Created', render: (wallet) => formatDateTime(wallet.createdDate) },
        ]}
      />
    </div>
  );
}
