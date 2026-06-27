import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { CreateGrnItemModal } from '../components/CreateGrnItemModal';
import { CreateGrnPaymentModal } from '../components/CreateGrnPaymentModal';
import { supplierApi } from '../services/api';
import { Supplier, GrnItem } from '../types/pos';
import { navigate } from '../utils/routing';

export function CreateGrnPage() {
    const [headerData, setHeaderData] = useState({
        supplierId: '',
        grnCode: '',
        invoiceNo: '',
        receivedDate: new Date().toISOString().slice(0, 10),
        batchCode: '',
    });

    const [items, setItems] = useState<Partial<GrnItem>[]>([]);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        supplierApi.list().then(setSuppliers).catch(console.error);
    }, []);

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHeaderData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddItem = (item: Partial<GrnItem>) => {
        setItems(prev => [...prev, item]);
        setIsItemModalOpen(false);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmitCheckout = () => {
        if (!headerData.supplierId || !headerData.invoiceNo) {
            alert('Please select a supplier and provide an invoice number.');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one product item to the GRN.');
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const calculatedTotalAmount = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.purchasePrice || 0)), 0);

    return (
        <div className="px-5 py-6 sm:px-7 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Create Receipt Note (GRN)"
                description="Draft a new goods receipt note, link items, and record initial payment."
            />

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">1. GRN Details</h3>
                </div>
                <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Supplier</label>
                        <select required name="supplierId" value={headerData.supplierId} onChange={handleHeaderChange} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <option value="" disabled>Select a supplier</option>
                            {suppliers.map(s => (
                                <option key={s.id || s.mysqlId} value={s.mysqlId || s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">GRN Code</label>
                        <input required name="grnCode" value={headerData.grnCode} onChange={handleHeaderChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. GRN-2026" />
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
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">2. Products Received</h3>
                    <button onClick={() => setIsItemModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">
                        <Plus className="h-4 w-4" />
                        Add Product
                    </button>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="min-w-full divide-y text-left text-sm divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Product</th>
                                <th className="px-6 py-3 font-medium">Variation</th>
                                <th className="px-6 py-3 font-medium">Qty</th>
                                <th className="px-6 py-3 font-medium shrink-0">Total</th>
                                <th className="px-6 py-3 font-medium text-right relative"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No items added to this GRN yet.</td>
                                </tr>
                            ) : (
                                items.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{item.productName}</td>
                                        <td className="px-6 py-4 text-slate-500">{item.variation || '-'}</td>
                                        <td className="px-6 py-4">{item.quantity}</td>
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

            <CreateGrnItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onAdd={handleAddItem}
            />

            <CreateGrnPaymentModal
                isOpen={isPaymentModalOpen}
                headerData={headerData}
                items={items}
                baseCalculatedTotal={calculatedTotalAmount}
                suppliers={suppliers}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={() => navigate('/grns')}
            />
        </div>
    );
}
