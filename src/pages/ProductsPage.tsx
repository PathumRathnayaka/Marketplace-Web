import { useCallback, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { CreateProductModal } from '../components/CreateProductModal';
import { ProductBatchesModal } from '../components/ProductBatchesModal';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { productApi } from '../services/api';
import { Product } from '../types/pos';
import { formatDate } from '../utils/format';

export function ProductsPage() {
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(() => productApi.list(), [refreshCounter]);
  const { data: products, loading, error } = useAsyncData<Product[]>(loadProducts, []);
  const activeProducts = products.filter((product) => product.status === 'ACTIVE' && !product.deleted);

  return (
    <div className="px-5 py-6 sm:px-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="[&>div]:mb-6">
          <PageHeader
            title="Products"
            description="Read the synced product master for this tenant, including category, unit type, status, and minimum quantity."
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Create product
        </button>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Total products" value={products.length.toString()} icon={Package} />
        <MetricCard label="Active" value={activeProducts.length.toString()} icon={Package} />
        <MetricCard
          label="Deleted"
          value={products.filter((product) => product.deleted).length.toString()}
          icon={Package}
        />
      </div>
      <DataTable
        title="Product list"
        data={products}
        loading={loading}
        error={error}
        emptyMessage="No products found"
        getRowKey={(product, index) => product.id || product.mysqlId || index.toString()}
        onRowClick={(product) => setSelectedProduct(product)}
        columns={[
          { key: 'name', header: 'Name', render: (product) => product.name || '-' },
          { key: 'category', header: 'Category', render: (product) => product.category || product.categoryName || '-' },
          { key: 'unit', header: 'Unit', render: (product) => product.unitType || '-' },
          { key: 'min', header: 'Min Qty', render: (product) => product.minimumQuantity ?? '-' },
          { key: 'status', header: 'Status', render: (product) => <StatusBadge value={product.status} /> },
          { key: 'created', header: 'Created', render: (product) => formatDate(product.createdDate) },
        ]}
      />
      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setRefreshCounter((prev) => prev + 1);
        }}
      />

      <ProductBatchesModal
        isOpen={selectedProduct !== null}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
