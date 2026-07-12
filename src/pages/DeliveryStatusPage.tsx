import { useEffect, useMemo, useState } from 'react';
import { Loader2, Phone, RefreshCw, Store, Truck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ordersApi } from '../services/api';
import { DeliveryStatus, ShopOrder } from '../types/orders';
import { navigate } from '../utils/routing';

// Only Order GRNs appear here: shop_orders in supplier-service is written solely
// by the Order GRN checkout, so every row is an imported-supplier order. Normal
// GRNs (LOCAL suppliers) have no counterpart there and are correctly absent.

const STATUS_LABELS: Record<DeliveryStatus, string> = {
    ORDERED: 'Ordered',
    PACKING: 'Packing',
    ON_THE_WAY: 'On the way',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    RECEIVED: 'Received',
    CANCELLED: 'Cancelled',
};

const STATUS_STYLES: Record<DeliveryStatus, string> = {
    ORDERED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    PACKING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    ON_THE_WAY: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    SHIPPED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    RECEIVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

interface OrderGroup {
    key: string;
    grnCode?: string;
    supplierName: string;
    supplierPhone?: string;
    status: DeliveryStatus;
    createdAt?: string;
    items: ShopOrder[];
    total: number;
}

// One card per Order GRN: the flat lines are grouped back into the order the
// shop actually placed.
function groupOrders(orders: ShopOrder[]): OrderGroup[] {
    const groups = new Map<string, OrderGroup>();
    for (const order of orders) {
        const key = order.grnCode ? `grn:${order.grnCode}:${order.supplierId}` : `id:${order.id}`;
        let group = groups.get(key);
        if (!group) {
            group = {
                key,
                grnCode: order.grnCode,
                supplierName: order.supplierName || 'Marketplace supplier',
                supplierPhone: order.supplierPhone,
                status: order.status,
                createdAt: order.createdAt,
                items: [],
                total: 0,
            };
            groups.set(key, group);
        }
        group.items.push(order);
        group.total += (order.price || 0) * (order.quantity || 0);
    }
    return Array.from(groups.values());
}

export function DeliveryStatusPage() {
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            setOrders(await ordersApi.myShopOrders());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load your orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const groups = useMemo(() => groupOrders(orders), [orders]);

    return (
        <div className="px-5 py-6 sm:px-7 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <PageHeader
                    title="Delivery Status"
                    description="Order GRNs you placed with imported suppliers, and where each delivery has got to."
                />
                <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                    <Truck className="h-12 w-12 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">No orders yet</p>
                    <p className="mt-1 max-w-md text-sm text-slate-500">
                        When you create an Order GRN from an imported supplier, its delivery status shows up
                        here as the supplier packs and ships it.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/supplier-market')}
                        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        Browse suppliers
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map((group) => (
                        <div
                            key={group.key}
                            className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                        <Store className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                                            {group.supplierName}
                                            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                Imported
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {group.grnCode ? `GRN ${group.grnCode}` : 'No GRN code'}
                                            {group.createdAt
                                                ? ` · Ordered ${new Date(group.createdAt).toLocaleDateString()}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[group.status] || STATUS_STYLES.ORDERED}`}
                                    >
                                        {STATUS_LABELS[group.status] || group.status}
                                    </span>
                                    <p className="mt-1 font-mono text-sm text-slate-700 dark:text-slate-200">
                                        {group.total.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {group.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-100">
                                                {item.productName}
                                            </td>
                                            <td className="px-6 py-3 text-right text-slate-500">
                                                {item.quantity}
                                                {item.unitType ? ` ${item.unitType}` : ''} ·{' '}
                                                {(item.price || 0).toFixed(2)} each
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {group.supplierPhone && (
                                <div className="border-t border-slate-200 px-6 py-3 text-sm dark:border-slate-800">
                                    <a
                                        href={`tel:${group.supplierPhone}`}
                                        className="inline-flex items-center gap-2 font-medium text-emerald-600 hover:underline"
                                    >
                                        <Phone className="h-4 w-4" />
                                        {group.supplierPhone}
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
