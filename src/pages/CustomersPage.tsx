import { useCallback } from 'react';
import { Mail, Users } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { customerApi } from '../services/api';
import { Customer } from '../types/pos';
import { formatDateTime } from '../utils/format';

export function CustomersPage() {
  const loadCustomers = useCallback(() => customerApi.list(), []);
  const { data: customers, loading, error } = useAsyncData<Customer[]>(loadCustomers, []);
  const withEmail = customers.filter((customer) => Boolean(customer.email)).length;

  return (
    <div className="px-5 py-6 sm:px-7">
      <PageHeader
        title="Customers"
        description="Read customer contact records synced for this tenant."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <MetricCard label="Customers" value={customers.length.toString()} icon={Users} />
        <MetricCard label="With email" value={withEmail.toString()} icon={Mail} />
      </div>
      <DataTable
        title="Customer list"
        data={customers}
        loading={loading}
        error={error}
        emptyMessage="No customers found"
        getRowKey={(customer, index) => customer.id || customer.mysqlId || index.toString()}
        columns={[
          { key: 'contact', header: 'Contact', render: (customer) => customer.contact || '-' },
          { key: 'email', header: 'Email', render: (customer) => customer.email || '-' },
          { key: 'created', header: 'Created', render: (customer) => formatDateTime(customer.createdDate) },
        ]}
      />
    </div>
  );
}
