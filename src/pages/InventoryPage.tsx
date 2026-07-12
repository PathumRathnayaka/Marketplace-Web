import { useCallback, useState } from 'react';
import { Boxes, CircleDollarSign, Trash2 } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { inventoryApi, ordersApi, productVariationApi } from '../services/api';
import { ProductQuantityBatch } from '../types/pos';
import { formatDate, formatMoney } from '../utils/format';
import { reconcileDeliveredOrderGrns } from '../utils/orderGrnFulfillment';

export function InventoryPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Catch up on any Order GRNs the supplier has since marked Delivered before
  // reading the batch list, so newly-arrived stock isn't missing just because
  // the shop never visited the Delivery Status page.
  const loadBatches = useCallback(async () => {
    try {
      const orders = await ordersApi.myShopOrders();
      await reconcileDeliveredOrderGrns(orders);
    } catch (err) {
      console.error('Failed to reconcile delivered order GRNs', err);
    }
    return inventoryApi.listBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);
  const { data: batches, loading, error } = useAsyncData<ProductQuantityBatch[]>(loadBatches, []);

  // Correction tool for batches that were created by mistake (e.g. an Order
  // GRN batch created before its delivery was confirmed) — not a normal
  // stock-adjustment path.
  const handleDelete = async (batch: ProductQuantityBatch) => {
    const id = batch.mysqlId || batch.id;
    if (!id) return;
    if (!confirm(`Remove this batch of "${batch.productName || 'product'}" from inventory? Only do this to correct a mistake, not to record stock leaving the shop.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await inventoryApi.deleteBatch(id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove batch.');
    } finally {
      setDeletingId(null);
    }
  };
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
        sortDescendingBy={(batch) => batch.createdAt}
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
          {
            key: 'actions',
            header: '',
            render: (batch) => {
              const id = batch.mysqlId || batch.id || '';
              return (
                <button
                  type="button"
                  onClick={() => handleDelete(batch)}
                  disabled={deletingId === id}
                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                  title="Remove this batch (correction only)"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              );
            },
          },
        ]}
      />
    </div>
  );
}
