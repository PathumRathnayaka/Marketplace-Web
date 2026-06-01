import { useCallback } from 'react';
import { Package } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { productApi } from '../services/api';
import { Product } from '../types/pos';
import { formatDate } from '../utils/format';

export function ProductsPage() {
  const loadProducts = useCallback(() => productApi.list(), []);
  const { data: products, loading, error } = useAsyncData<Product[]>(loadProducts, []);
  const activeProducts = products.filter((product) => product.status === 'ACTIVE' && !product.deleted);

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Products"
        description="Read the synced product master for this tenant, including category, unit type, status, and minimum quantity."
      />
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
        columns={[
          { key: 'mysqlId', header: 'Code', render: (product) => product.mysqlId || '-' },
          { key: 'name', header: 'Name', render: (product) => product.name || '-' },
          { key: 'category', header: 'Category', render: (product) => product.category || product.categoryName || '-' },
          { key: 'unit', header: 'Unit', render: (product) => product.unitType || '-' },
          { key: 'min', header: 'Min Qty', render: (product) => product.minimumQuantity ?? '-' },
          { key: 'status', header: 'Status', render: (product) => <StatusBadge value={product.status} /> },
          { key: 'created', header: 'Created', render: (product) => formatDate(product.createdDate) },
        ]}
      />
    </div>
  );
}
