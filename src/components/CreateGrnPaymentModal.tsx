import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { grnApi, productApi, productVariationApi, inventoryApi } from '../services/api';
import { Supplier, GrnItem } from '../types/pos';

interface CreateGrnPaymentModalProps {
    isOpen: boolean;
    headerData: {
        supplierId: string;
        grnCode: string;
        invoiceNo: string;
        receivedDate: string;
        batchCode: string;
    };
    items: Partial<GrnItem>[];
    baseCalculatedTotal: number;
    suppliers: Supplier[];
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateGrnPaymentModal({
    isOpen, headerData, items, baseCalculatedTotal, suppliers, onClose, onSuccess
}: CreateGrnPaymentModalProps) {
    const [formData, setFormData] = useState({
        totalAmount: '' as number | string,
        paidAmount: '' as number | string,
        dueAmount: '' as number | string,
        status: 'RECEIVED',
        paymentStatus: 'PARTIAL',

        paymentAmount: '' as number | string,
        paymentDate: new Date().toISOString().slice(0, 16),
        paymentMethod: 'CASH',
        referenceNo: '',
        notes: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                totalAmount: baseCalculatedTotal,
                paidAmount: '',
                dueAmount: baseCalculatedTotal,
                paymentAmount: '',
            }));
        }
    }, [isOpen, baseCalculatedTotal]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleCalcDue = () => {
        const total = Number(formData.totalAmount) || 0;
        const paid = Number(formData.paidAmount) || 0;
        setFormData(prev => ({
            ...prev,
            dueAmount: Math.max(0, total - paid),
            paymentAmount: paid // Sync to real payment
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const selectedSupplier = suppliers.find((s) => (s.mysqlId || s.id) === headerData.supplierId);
            const supplierName = selectedSupplier ? selectedSupplier.name : '';

            // 1. Resolve missing IDs and auto-create Batches out of EVERY mapped line directly
            const hydratedItems: Partial<GrnItem>[] = [];

            for (const rootItem of items) {
                let currentItem = { ...rootItem };

                // A. Check Product existence
                if (!currentItem.productId) {
                    const productRes: any = await productApi.create({
                        name: currentItem.productName,
                        category: 'Uncategorized',
                        unitType: 'Units',
                        status: 'ACTIVE',
                        minimumQuantity: 0,
                    });
                    const productData = productRes?.data || productRes;
                    currentItem.productId = productData.mysqlId || productData.id;
                }

                // B. Check Variation existence
                if (!currentItem.variationId && currentItem.productId) {
                    const variationRes: any = await productVariationApi.create({
                        productId: currentItem.productId,
                        productName: currentItem.productName,
                        variation: currentItem.variation || 'Default',
                    });
                    const variationData = variationRes?.data || variationRes;
                    currentItem.variationId = variationData.mysqlId || variationData.id;
                }

                // C. Explicitly bind Inventory Batches exactly bridging native Modal actions automatically!
                await inventoryApi.createBatch({
                    productId: currentItem.productId,
                    productName: currentItem.productName,
                    variationId: currentItem.variationId,
                    variationSize: null,
                    supplierId: headerData.supplierId,
                    supplierName: supplierName,
                    barcode: currentItem.barcode,
                    quantity: Number(currentItem.quantity) || 0,
                    batchCode: headerData.batchCode,
                    salePrice: Number(currentItem.salePrice) || 0,
                    purchasePrice: Number(currentItem.purchasePrice) || 0,
                    ourPrice: Number(currentItem.ourPrice) || 0,
                    brand: currentItem.brand,
                    warehouseNo: currentItem.warehouseNo,
                    discount: Number(currentItem.discount) || 0,
                    tax: Number(currentItem.tax) || 0,
                    expireDate: currentItem.expireDate,
                });

                // Attach batch payload securely
                currentItem.batchCode = headerData.batchCode;
                hydratedItems.push(currentItem);
            }

            // 2. Transact fully hydrated GRN object
            const grnPayload = {
                grnCode: headerData.grnCode,
                supplierId: headerData.supplierId,
                supplierName: supplierName,
                invoiceNo: headerData.invoiceNo,
                receivedDate: headerData.receivedDate,
                totalAmount: Number(formData.totalAmount) || 0,
                paidAmount: Number(formData.paidAmount) || 0,
                dueAmount: Number(formData.dueAmount) || 0,
                status: formData.status,
                paymentStatus: formData.paymentStatus,
                items: hydratedItems,
            };

            const grnRes: any = await grnApi.create(grnPayload);
            const grnData = grnRes?.data || grnRes;
            const grnMysqlId = grnData.mysqlId || grnData.id;

            if (!grnMysqlId) {
                throw new Error("Created GRN safely but failed to read returned ID for Payment linking.");
            }

            // 3. Create underlying GRN Payment 
            const paymentPayload = {
                grnMysqlId: grnMysqlId,
                paymentDate: formData.paymentDate,
                amount: Number(formData.paymentAmount) || 0,
                paymentMethod: formData.paymentMethod,
                referenceNo: formData.referenceNo,
                notes: formData.notes,
            };

            await grnApi.createPayment(paymentPayload);
            onSuccess();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to finalize GRN and its payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />

            <div className="relative z-[60] flex w-full max-w-2xl flex-col transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Verify Totals & Payment Checkout
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Finalize GRN totals and record the initial supplier payment transaction.
                        </p>
                    </div>
                    <button onClick={onClose} disabled={loading} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form id="create-grn-checkout-form" onSubmit={handleSubmit} className="space-y-8">
                        <section>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Gross Amounts
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Total Amount</label>
                                    <input required name="totalAmount" value={formData.totalAmount} onChange={handleChange} onBlur={handleCalcDue} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Paid Amount</label>
                                    <input required name="paidAmount" value={formData.paidAmount} onChange={handleChange} onBlur={handleCalcDue} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Due Amount</label>
                                    <input required name="dueAmount" value={formData.dueAmount} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 shrink">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">GRN Status</label>
                                    <select required name="status" value={formData.status} onChange={handleChange} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                        <option value="RECEIVED">RECEIVED</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 shrink">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment Status</label>
                                    <select required name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                        <option value="PARTIAL">PARTIAL</option>
                                        <option value="PAID">PAID</option>
                                        <option value="UNPAID">UNPAID</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-200 dark:border-slate-800" />

                        <section>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Payment Entry
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment Amount</label>
                                    <input required name="paymentAmount" value={formData.paymentAmount} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment Date</label>
                                    <input required name="paymentDate" value={formData.paymentDate} onChange={handleChange} type="datetime-local" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment Method</label>
                                    <select required name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                        <option value="CASH">CASH</option>
                                        <option value="CARD">CARD</option>
                                        <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                        <option value="CHEQUE">CHEQUE</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Reference No</label>
                                    <input name="referenceNo" value={formData.referenceNo} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Cheque No" />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes (Optional)</label>
                                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <button type="button" onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        Back to Items
                    </button>
                    <button type="submit" form="create-grn-checkout-form" disabled={loading} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm & Save GRN
                    </button>
                </div>
            </div>
        </div>
    );
}
