import React, { useState, useEffect } from 'react';
import { Trash2, Store, ShoppingCart } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { CreateGrnPaymentModal } from '../components/CreateGrnPaymentModal';
import { ordersApi, shopProfileApi } from '../services/api';
import { Supplier, GrnItem } from '../types/pos';
import { ShopOrderItemInput, ShopProfile } from '../types/orders';
import { navigate } from '../utils/routing';
import {
    OrderGrnCart,
    getOrderGrnCart,
    clearOrderGrnCart,
} from '../utils/orderGrnCart';

// The Order GRN is a GRN whose products come from an authorized (marketplace)
// supplier. It saves to the same pos GRN table as a normal GRN, and additionally
// notifies supplier-service so the supplier sees which shop ordered.
export function OrderGrnPage() {
    const [cart, setCart] = useState<OrderGrnCart | null>(() => getOrderGrnCart());

    const [headerData, setHeaderData] = useState({
        supplierId: '',
        grnCode: '',
        invoiceNo: '',
        receivedDate: new Date().toISOString().slice(0, 10),
        batchCode: '',
    });

    const [items, setItems] = useState<Partial<GrnItem>[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Seed the GRN line items from the draft Order GRN cart.
    useEffect(() => {
        if (!cart) return;
        setHeaderData((prev) => ({ ...prev, supplierId: cart.posSupplierId }));
        setItems(
            cart.items.map((i) => ({
                productName: i.productName,
                brand: i.brand,
                category: i.categoryName,
                unitType: i.unitType,
                quantity: i.quantity,
                purchasePrice: i.price,
            })),
        );
    }, [cart]);

    // The imported supplier, shaped for CreateGrnPaymentModal's supplier lookup.
    const posSupplier: Supplier | null = cart
        ? { id: cart.posSupplierId, mysqlId: cart.posSupplierId, name: cart.supplier.businessName }
        : null;

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setHeaderData((prev) => ({ ...prev, [name]: value }));
    };

    const handleQtyChange = (index: number, value: string) => {
        const qty = value === '' ? 0 : Number(value);
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, quantity: qty } : it)));
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmitCheckout = () => {
        if (!headerData.invoiceNo) {
            alert('Please provide an invoice number.');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one product to the Order GRN.');
            return;
        }
        setIsPaymentModalOpen(true);
    };

    // After the pos GRN + payment are saved, record the order in supplier-service
    // so the authorized supplier can see which shop ordered which products.
    const handleOrderGrnCreated = async () => {
        if (cart) {
            try {
                const orderItems: ShopOrderItemInput[] = items.map((it) => ({
                    productId: it.productId,
                    productName: it.productName || 'Unnamed product',
                    unitType: it.unitType,
                    quantity: Number(it.quantity) || 0,
                    price: Number(it.purchasePrice) || 0,
                }));

                let shopProfile: ShopProfile | undefined;
                try {
                    const mine = await shopProfileApi.getMine();
                    if (mine && mine.shopName) {
                        shopProfile = mine;
                    }
                } catch (err) {
                    console.error('Failed to load shop profile for order', err);
                }

                await ordersApi.create({
                    supplierId: cart.marketplaceSupplierId,
                    grnCode: headerData.grnCode,
                    items: orderItems,
                    shopProfile,
                });
            } catch (err) {
                console.error('Failed to notify supplier of the order', err);
                alert(
                    'The GRN was saved, but notifying the supplier failed. You can still contact them directly.',
                );
            }
        }
        clearOrderGrnCart();
        navigate('/grns');
    };

    const calculatedTotalAmount = items.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.purchasePrice || 0),
        0,
    );

    if (!cart || cart.items.length === 0) {
        return (
            <div className="px-5 py-6 sm:px-7 max-w-7xl mx-auto space-y-6">
                <PageHeader
                    title="Order GRN"
                    description="Receive stock ordered from an authorized marketplace supplier."
                />
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
                    <ShoppingCart className="h-12 w-12 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                        No Order GRN in progress
                    </p>
                    <p className="mt-1 max-w-md text-sm text-slate-500">
                        Go to <span className="font-medium">Buy from Suppliers</span>, open a product's
                        “Contact supplier” card, and choose <span className="font-medium">Add Order GRN</span> to
                        start an order.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/supplier-market')}
                        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500"
                    >
                        Browse suppliers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-6 sm:px-7 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Create Order GRN"
                description="Receive stock ordered from an authorized marketplace supplier. The supplier is notified of your order."
            />

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">1. GRN Details</h3>
                </div>
                <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Supplier</label>
                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                <Store className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                    {cart.supplier.businessName}
                                </p>
                                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    Imported
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">GRN Code</label>
                        <input required name="grnCode" value={headerData.grnCode} onChange={handleHeaderChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. OGRN-2026" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Invoice No</label>
                        <input required name="invoiceNo" value={headerData.invoiceNo} onChange={handleHeaderChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. INV-1001" />
                    </div>
                    <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Received Date</label>
                        <input required name="receivedDate" value={headerData.receivedDate} onChange={handleHeaderChange} type="date" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Global Batch Code</label>
                        <input required name="batchCode" value={headerData.batchCode} onChange={handleHeaderChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. BCH-AUG-1" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">2. Ordered Products</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="min-w-full divide-y text-left text-sm divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Product</th>
                                <th className="px-6 py-3 font-medium">Unit</th>
                                <th className="px-6 py-3 font-medium">Unit Price</th>
                                <th className="px-6 py-3 font-medium">Qty</th>
                                <th className="px-6 py-3 font-medium">Total</th>
                                <th className="px-6 py-3 font-medium text-right"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No products in this Order GRN.</td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{item.productName}</td>
                                        <td className="px-6 py-4 text-slate-500">{item.unitType || '-'}</td>
                                        <td className="px-6 py-4 font-mono">{(item.purchasePrice || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity ?? ''}
                                                onChange={(e) => handleQtyChange(index, e.target.value)}
                                                className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-mono text-emerald-600">
                                            {((item.quantity || 0) * (item.purchasePrice || 0)).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button onClick={handleSubmitCheckout} disabled={items.length === 0} className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
                    Checkout & Apply Payments
                </button>
            </div>

            <CreateGrnPaymentModal
                isOpen={isPaymentModalOpen}
                headerData={headerData}
                items={items}
                baseCalculatedTotal={calculatedTotalAmount}
                suppliers={posSupplier ? [posSupplier] : []}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handleOrderGrnCreated}
            />
        </div>
    );
}
