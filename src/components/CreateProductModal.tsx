import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { productApi, productVariationApi, inventoryApi, supplierApi } from '../services/api';
import { Supplier } from '../types/pos';

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
    const [formData, setFormData] = useState({
        // Product
        name: '',
        category: '',
        unitType: 'Boxes',
        status: 'ACTIVE',
        minimumQuantity: '',
        // Variation
        variation: 'Default',
        // Batch
        variationSize: 'Default',
        supplierId: '',
        barcode: '',
        quantity: '',
        batchCode: '',
        salePrice: '',
        purchasePrice: '',
        ourPrice: '',
        brand: '',
        warehouseNo: '',
        discount: '',
        tax: '',
        expireDate: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    useEffect(() => {
        if (isOpen) {
            supplierApi.list().then(setSuppliers).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // 1. Create Product
            const productPayload = {
                name: formData.name,
                category: formData.category,
                unitType: formData.unitType,
                status: formData.status,
                minimumQuantity: formData.minimumQuantity === '' ? 0 : Number(formData.minimumQuantity),
            };
            const productRes: any = await productApi.create(productPayload);
            const productData = productRes?.data || productRes;
            const productId = productData.mysqlId || productData.id;

            // 2. Create Variation
            const variationPayload = {
                productId: productId,
                productName: formData.name,
                variation: formData.variation,
            };
            const variationRes: any = await productVariationApi.create(variationPayload);
            const variationData = variationRes?.data || variationRes;
            const variationId = variationData.mysqlId || variationData.id;

            // 3. Create Quantity Batch
            const selectedSupplier = suppliers.find((s) => (s.mysqlId || s.id) === formData.supplierId);
            const supplierName = selectedSupplier ? selectedSupplier.name : '';

            const batchPayload = {
                productId: productId,
                productName: formData.name,
                variationId: variationId,
                variationSize: formData.variationSize,
                supplierId: formData.supplierId,
                supplierName: supplierName,
                barcode: formData.barcode,
                quantity: Number(formData.quantity) || 0,
                batchCode: formData.batchCode,
                salePrice: Number(formData.salePrice) || 0,
                purchasePrice: Number(formData.purchasePrice) || 0,
                ourPrice: Number(formData.ourPrice) || 0,
                brand: formData.brand,
                warehouseNo: formData.warehouseNo,
                discount: Number(formData.discount) || 0,
                tax: Number(formData.tax) || 0,
                expireDate: formData.expireDate,
            };
            await inventoryApi.createBatch(batchPayload);

            onSuccess();
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Failed to create product setup fully.');
        } finally {
            setLoading(false);
        }
    };

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
                            Create New Product
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Fill out product, variation, and initial batch details all at once.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-6">
                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <form id="create-product-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* Product Section */}
                        <section>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                1. Product Information
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                                    <input required name="name" value={formData.name} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Anchor Milk Powder 400g" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                                    <input required name="category" value={formData.category} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Dairy" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Unit Type</label>
                                    <input required name="unitType" value={formData.unitType} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Boxes" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Minimum Quantity</label>
                                    <input required name="minimumQuantity" value={formData.minimumQuantity} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Brand</label>
                                    <input name="brand" value={formData.brand} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Anchor" />
                                </div>
                            </div>
                        </section>

                        {/* Variation Section */}
                        <section>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                2. Variation Details
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Variation</label>
                                    <input required name="variation" value={formData.variation} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Default" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Variation Size</label>
                                    <input required name="variationSize" value={formData.variationSize} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. Default" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Barcode</label>
                                    <input required name="barcode" value={formData.barcode} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. 1234567890123" />
                                </div>
                            </div>
                        </section>

                        {/* Batch & Inventory Section */}
                        <section>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                3. Initial Batch & Inventory
                            </h4>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-1.5 lg:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Supplier</label>
                                    <select required name="supplierId" value={formData.supplierId} onChange={handleChange} className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                                        <option value="" disabled>Select a supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.id || s.mysqlId} value={s.mysqlId || s.id}>{s.name} ({s.contact || s.phone})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Batch Code</label>
                                    <input required name="batchCode" value={formData.batchCode} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. BCH-AUG-24" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Initial Quantity</label>
                                    <input required name="quantity" value={formData.quantity} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Purchase Price</label>
                                    <input required name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Our Price</label>
                                    <input required name="ourPrice" value={formData.ourPrice} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Sale Price (MSRP)</label>
                                    <input required name="salePrice" value={formData.salePrice} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Warehouse No</label>
                                    <input required name="warehouseNo" value={formData.warehouseNo} onChange={handleChange} type="text" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="e.g. WH-A" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Discount</label>
                                    <input required name="discount" value={formData.discount} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Tax</label>
                                    <input required name="tax" value={formData.tax} onChange={handleChange} type="number" step="0.01" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Expire Date</label>
                                    <input required name="expireDate" value={formData.expireDate} onChange={handleChange} type="date" className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-product-form"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Create Everything
                    </button>
                </div>
            </div>
        </div>
    );
}
