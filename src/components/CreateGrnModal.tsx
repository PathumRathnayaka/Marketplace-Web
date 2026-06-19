import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { productApi, productVariationApi, supplierApi, grnApi } from '../services/api';
import { Supplier, Product } from '../types/pos';

interface CreateGrnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (grnMysqlId: string) => void;
}

export function CreateGrnModal({ isOpen, onClose, onSuccess }: CreateGrnModalProps) {
    const [headerData, setHeaderData] = useState({
        grnCode: '',
        supplierId: '',
        invoiceNo: '',
        receivedDate: '',
        totalAmount: '' as number | string,
        paidAmount: '' as number | string,
        dueAmount: '' as number | string,
        status: 'RECEIVED',
        paymentStatus: 'PARTIAL',
    });

    const [itemData, setItemData] = useState({
        productName: '',
        variation: 'Default',
        quantity: '' as number | string,
        purchasePrice: '' as number | string,
        salePrice: '' as number | string,
        ourPrice: '' as number | string,
        barcode: '',
        batchCode: '',
        brand: '',
        warehouseNo: '',
        discount: '' as number | string,
        tax: '' as number | string,
        expireDate: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // Caching
    const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
    const [cachedVariations, setCachedVariations] = useState<any[]>([]);

    // Dropdown visibility
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showVariationDropdown, setShowVariationDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            supplierApi.list().then(setSuppliers).catch(console.error);
            productApi.list().then(setCachedProducts).catch(console.error);
            productVariationApi.list().then(setCachedVariations).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setHeaderData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setItemData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setItemData(prev => ({ ...prev, productName: e.target.value }));
        setShowProductDropdown(true);
    };

    const handleVariationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setItemData(prev => ({ ...prev, variation: e.target.value }));
        setShowVariationDropdown(true);
    };

    const selectProduct = (p: Product) => {
        setItemData(prev => ({
            ...prev,
            productName: p.name || '',
        }));
        setShowProductDropdown(false);
    };

    const selectVariation = (v: any) => {
        setItemData(prev => ({
            ...prev,
            variation: v.variation || '',
        }));
        setShowVariationDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // Find resolved entities
            const matchedProduct = cachedProducts.find(p => p.name === itemData.productName);
            const productId = matchedProduct?.mysqlId || matchedProduct?.id || null;

            const matchedVariation = cachedVariations.find(v => v.productId === productId && v.variation === itemData.variation);
            const variationId = matchedVariation?.mysqlId || matchedVariation?.id || null;

            const selectedSupplier = suppliers.find((s) => (s.mysqlId || s.id) === headerData.supplierId);
            const supplierName = selectedSupplier ? selectedSupplier.name : '';

            // Construct GRN Item embedded object
            const itemPayload: any = {
                productId: productId,
                productName: itemData.productName,
                variationId: variationId,
                variationSize: null,
                quantity: Number(itemData.quantity) || 0,
                purchasePrice: Number(itemData.purchasePrice) || 0,
                salePrice: Number(itemData.salePrice) || 0,
                ourPrice: Number(itemData.ourPrice) || 0,
                barcode: itemData.barcode,
                batchCode: itemData.batchCode,
                brand: itemData.brand,
                warehouseNo: itemData.warehouseNo,
                tax: Number(itemData.tax) || 0,
                discount: Number(itemData.discount) || 0,
                expireDate: itemData.expireDate,
            };

            // Construct Final Payload
            const grnPayload = {
                grnCode: headerData.grnCode,
                supplierId: headerData.supplierId,
                supplierName: supplierName,
                invoiceNo: headerData.invoiceNo,
                receivedDate: headerData.receivedDate,
                totalAmount: Number(headerData.totalAmount) || 0,
                paidAmount: Number(headerData.paidAmount) || 0,
                dueAmount: Number(headerData.dueAmount) || 0,
                status: headerData.status,
                paymentStatus: headerData.paymentStatus,
                items: [itemPayload],
            };

            const grnRes: any = await grnApi.create(grnPayload);
            const grnData = grnRes?.data || grnRes;
            const grnMysqlId = grnData.mysqlId || grnData.id;

            if (grnMysqlId) {
                onSuccess(grnMysqlId);
            } else {
                throw new Error("Created GRN safely but failed to read returned ID for Payment linking.");
            }
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to create GRN.');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredProducts = itemData.productName
        ? cachedProducts.filter(p => (p.name || '').toLowerCase().includes(itemData.productName.toLowerCase()))
        : cachedProducts;

    const matchedProdForVar = cachedProducts.find(p => p.name === itemData.productName);
    let activeVariations = matchedProdForVar
        ? cachedVariations.filter(v => v.productId === matchedProdForVar.mysqlId || v.productId === matchedProdForVar.id)
        : [];

    const filteredVariations = itemData.variation
        ? activeVariations.filter(v => (v.variation || '').toLowerCase().includes(itemData.variation.toLowerCase()))
        : activeVariations;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative z-50 flex max-h-[90vh] w-full max-w-4xl flex-col transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Create New GRN
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Add goods receipt notes with an embedded stock item.
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-6">
                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form id="create-grn-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* GRN Information */}
                        <section>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                1. Invoice & Supplier
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                    <input required name="grnCode" value={headerData.grnCode} onChange={handleHeaderChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="GRN-2026-001" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Invoice No</label>
                                    <input required name="invoiceNo" value={headerData.invoiceNo} onChange={handleHeaderChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="INV-2026-001" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Received Date</label>
                                    <input required name="receivedDate" value={headerData.receivedDate} onChange={handleHeaderChange} type="date" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Total Amount</label>
                                    <input required name="totalAmount" value={headerData.totalAmount} onChange={handleHeaderChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Paid Amount</label>
                                    <input required name="paidAmount" value={headerData.paidAmount} onChange={handleHeaderChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Due Amount</label>
                                    <input required name="dueAmount" value={headerData.dueAmount} onChange={handleHeaderChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
                                    <select name="status" value={headerData.status} onChange={handleHeaderChange} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                        <option value="RECEIVED">RECEIVED</option>
                                        <option value="PENDING">PENDING</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Payment Status</label>
                                    <select name="paymentStatus" value={headerData.paymentStatus} onChange={handleHeaderChange} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                        <option value="PARTIAL">PARTIAL</option>
                                        <option value="PAID">PAID</option>
                                        <option value="UNPAID">UNPAID</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-200 dark:border-slate-800" />

                        {/* GRN Item Info */}
                        <section>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                2. Stock Item Details
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-1.5 relative lg:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Product Name</label>
                                    <input
                                        required autoComplete="off" name="productName" value={itemData.productName}
                                        onChange={handleNameChange} onFocus={() => setShowProductDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                                        type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        placeholder="Search product..."
                                    />
                                    {showProductDropdown && filteredProducts.length > 0 && (
                                        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg border border-slate-300 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                            {filteredProducts.map(p => (
                                                <li key={p.id || p.mysqlId} className="cursor-pointer px-3 py-2 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => selectProduct(p)}>
                                                    {p.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="space-y-1.5 relative lg:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Variation</label>
                                    <input
                                        required autoComplete="off" name="variation" value={itemData.variation}
                                        onChange={handleVariationChange} onFocus={() => setShowVariationDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowVariationDropdown(false), 200)}
                                        type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    />
                                    {showVariationDropdown && filteredVariations.length > 0 && (
                                        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg border border-slate-300 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                            {filteredVariations.map(v => (
                                                <li key={v.id || v.mysqlId} className="cursor-pointer px-3 py-2 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => selectVariation(v)}>
                                                    {v.variation}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Batch Code</label>
                                    <input required name="batchCode" value={itemData.batchCode} onChange={handleItemChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Barcode</label>
                                    <input required name="barcode" value={itemData.barcode} onChange={handleItemChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Brand</label>
                                    <input name="brand" value={itemData.brand} onChange={handleItemChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Quantity</label>
                                    <input required name="quantity" value={itemData.quantity} onChange={handleItemChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Purchase Price</label>
                                    <input required name="purchasePrice" value={itemData.purchasePrice} onChange={handleItemChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Sale Price</label>
                                    <input required name="salePrice" value={itemData.salePrice} onChange={handleItemChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Our Price</label>
                                    <input required name="ourPrice" value={itemData.ourPrice} onChange={handleItemChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Warehouse</label>
                                    <input name="warehouseNo" value={itemData.warehouseNo} onChange={handleItemChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Discount</label>
                                    <input name="discount" value={itemData.discount} onChange={handleItemChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Tax</label>
                                    <input name="tax" value={itemData.tax} onChange={handleItemChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5 lg:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Expire Date</label>
                                    <input name="expireDate" value={itemData.expireDate} onChange={handleItemChange} type="date" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <button type="button" onClick={onClose} disabled={loading} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        Cancel
                    </button>
                    <button type="submit" form="create-grn-form" disabled={loading} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm & Next
                    </button>
                </div>
            </div>
        </div>
    );
}
