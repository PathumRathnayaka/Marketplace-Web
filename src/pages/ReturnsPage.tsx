import { useCallback } from 'react';
import { RotateCcw, CircleDollarSign } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAsyncData } from '../hooks/useAsyncData';
import { grnApi, inventoryApi, productReturnApi } from '../services/api';
import { Grn, ProductQuantityBatch, ProductReturn, ProductReturnItem } from '../types/pos';
import { formatDateTime, formatMoney } from '../utils/format';

interface ReturnRow {
    returnCode: string;
    createdAt?: string;
    customerContact?: string;
    item: ProductReturnItem;
    batchCode: string;
    supplierName: string;
    grnCode: string;
}

interface ReturnsData {
    returns: ProductReturn[];
    batches: ProductQuantityBatch[];
    grns: Grn[];
}

function buildRows({ returns, batches, grns }: ReturnsData): ReturnRow[] {
    const batchById = new Map<string, ProductQuantityBatch>();
    batches.forEach((b) => {
        if (b.id) batchById.set(String(b.id), b);
        if (b.mysqlId) batchById.set(String(b.mysqlId), b);
    });

    // A batch has no direct grnId link. Both the batch and its GRN's item are stamped
    // with the same "Global Batch Code" at GRN-creation time, so productId+batchCode
    // is the only available key back to the originating GRN.
    const grnByProductAndBatchCode = new Map<string, Grn>();
    grns.forEach((grn) => {
        (grn.items || []).forEach((item) => {
            if (item.productId && item.batchCode) {
                grnByProductAndBatchCode.set(`${item.productId}::${item.batchCode}`, grn);
            }
        });
    });

    const rows: ReturnRow[] = [];
    returns.forEach((ret) => {
        (ret.returnItems || []).forEach((item) => {
            const batch = item.batchId ? batchById.get(String(item.batchId)) : undefined;
            const batchCode = batch?.batchCode || '';
            const grn = item.productId && batchCode
                ? grnByProductAndBatchCode.get(`${item.productId}::${batchCode}`)
                : undefined;

            rows.push({
                returnCode: ret.returnCode || ret.mysqlId || '-',
                createdAt: ret.createdAt,
                customerContact: ret.customerContact,
                item,
                batchCode: batchCode || '-',
                supplierName: item.supplierName || batch?.supplierName || '-',
                grnCode: grn?.grnCode || '-',
            });
        });
    });

    return rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function ReturnsPage() {
    const loadData = useCallback(
        () => Promise.all([productReturnApi.list(), inventoryApi.listBatches(), grnApi.list()])
            .then(([returns, batches, grns]) => ({ returns, batches, grns })),
        []
    );
    const { data, loading, error } = useAsyncData<ReturnsData>(loadData, { returns: [], batches: [], grns: [] });

    const rows = buildRows(data);
    const totalRefunded = data.returns.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0);

    return (
        <div className="px-5 py-6 sm:px-7">
            <PageHeader
                title="Product Returns"
                description="Every returned item, its batch, supplier, and originating GRN — for supplier replacement claims."
            />
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <MetricCard label="Returns" value={data.returns.length.toString()} icon={RotateCcw} />
                <MetricCard label="Returned items" value={rows.length.toString()} icon={RotateCcw} />
                <MetricCard label="Refunded to wallets" value={formatMoney(totalRefunded)} icon={CircleDollarSign} />
            </div>
            <DataTable
                title="Return records"
                data={rows}
                loading={loading}
                error={error}
                emptyMessage="No returns found"
                getRowKey={(row, index) => `${row.returnCode}-${row.item.mysqlId || index}`}
                columns={[
                    { key: 'code', header: 'Return', render: (row) => row.returnCode },
                    { key: 'customer', header: 'Customer', render: (row) => row.customerContact || '-' },
                    { key: 'product', header: 'Product', render: (row) => row.item.productName || '-' },
                    { key: 'qty', header: 'Qty', render: (row) => row.item.returnedQuantity ?? '-' },
                    { key: 'amount', header: 'Amount', render: (row) => formatMoney(row.item.returnAmount) },
                    { key: 'reason', header: 'Reason', render: (row) => <StatusBadge value={row.item.condition || 'RETURNED'} /> },
                    { key: 'batch', header: 'Batch', render: (row) => row.batchCode },
                    { key: 'grn', header: 'GRN', render: (row) => row.grnCode },
                    { key: 'supplier', header: 'Supplier', render: (row) => row.supplierName },
                    {
                        key: 'replacement',
                        header: 'Replacement',
                        render: (row) => (
                            <StatusBadge value={row.item.replacementGrnId ? 'REPLACED' : 'PENDING'} />
                        ),
                    },
                    { key: 'date', header: 'Returned', render: (row) => formatDateTime(row.createdAt) },
                ]}
            />
        </div>
    );
}
