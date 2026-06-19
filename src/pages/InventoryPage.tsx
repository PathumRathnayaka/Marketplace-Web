import { useCallback } from 'react';
import { Boxes, CircleDollarSign } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { inventoryApi, productVariationApi } from '../services/api';
import { ProductQuantityBatch } from '../types/pos';
import { formatDate, formatMoney } from '../utils/format';

export function InventoryPage() {
  const loadBatches = useCallback(() => inventoryApi.listBatches(), []);
  const { data: batches, loading, error } = useAsyncData<ProductQuantityBatch[]>(loadBatches, []);
  const loadVariations = useCallback(() => productVariationApi.list(), []);
  const { data: variations } = useAsyncData<any[]>(loadVariations, []);
  const quantity = batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
  const stockValue = batches.reduce(
    (sum, batch) => sum + (batch.quantity || 0) * (batch.purchasePrice || 0),
    0
  );

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Inventory batches"
        description="Read available stock by batch, warehouse, purchase price, sale price, and expiry date."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Batches" value={batches.length.toString()} icon={Boxes} />
        <MetricCard label="Total quantity" value={quantity.toString()} icon={Boxes} />
        <MetricCard label="Purchase value" value={formatMoney(stockValue)} icon={CircleDollarSign} />
      </div>
      <DataTable
        title="Batch list"
        data={batches}
        loading={loading}
        error={error}
        emptyMessage="No inventory batches found"
        getRowKey={(batch, index) => batch.id || batch.batchCode || index.toString()}
        columns={[
          { key: 'count', header: '#', render: (_batch, index) => index + 1 },
          { key: 'product', header: 'Product', render: (batch) => batch.productName || batch.productId || '-' },
          {
            key: 'variation', header: 'Variation', render: (batch) => {
              const v = variations.find((v: any) => v.mysqlId === batch.variationId || v.id === batch.variationId);
              return v?.variation || batch.variationId || '-';
            }
          },
          { key: 'quantity', header: 'Qty', render: (batch) => batch.quantity ?? '-' },
          { key: 'purchase', header: 'Purchase', render: (batch) => formatMoney(batch.purchasePrice) },
          { key: 'sale', header: 'Sale', render: (batch) => formatMoney(batch.salePrice) },
          { key: 'warehouse', header: 'Warehouse', render: (batch) => batch.warehouseNo || '-' },
          { key: 'expire', header: 'Expire', render: (batch) => formatDate(batch.expireDate) },
        ]}
      />
    </div>
  );
}
