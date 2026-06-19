import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { productApi, productVariationApi } from '../services/api';
import { Product, GrnItem } from '../types/pos';

interface CreateGrnItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: Partial<GrnItem>) => void;
}

export function CreateGrnItemModal({ isOpen, onClose, onAdd }: CreateGrnItemModalProps) {
    const [itemData, setItemData] = useState({
        productName: '',
        variation: 'Default',
        quantity: '' as number | string,
        purchasePrice: '' as number | string,
        salePrice: '' as number | string,
        ourPrice: '' as number | string,
        barcode: '',
        brand: '',
        warehouseNo: '',
        discount: '' as number | string,
        tax: '' as number | string,
        expireDate: '',
    });

    const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
    const [cachedVariations, setCachedVariations] = useState<any[]>([]);

    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showVariationDropdown, setShowVariationDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            productApi.list().then(setCachedProducts).catch(console.error);
            productVariationApi.list().then(setCachedVariations).catch(console.error);
            // Reset form
            setItemData({
                productName: '',
                variation: 'Default',
                quantity: '',
                purchasePrice: '',
                salePrice: '',
                ourPrice: '',
                barcode: '',
                brand: '',
                warehouseNo: '',
                discount: '',
                tax: '',
                expireDate: '',
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const matchedProduct = cachedProducts.find(p => p.name === itemData.productName);
        const productId = matchedProduct?.mysqlId || matchedProduct?.id || undefined;

        const matchedVariation = cachedVariations.find(v => v.productId === productId && v.variation === itemData.variation);
        const variationId = matchedVariation?.mysqlId || matchedVariation?.id || undefined;

        const itemPayload: Partial<GrnItem> = {
            productId: productId,
            productName: itemData.productName,
            variationId: variationId,
            quantity: Number(itemData.quantity) || 0,
            purchasePrice: Number(itemData.purchasePrice) || 0,
            salePrice: Number(itemData.salePrice) || 0,
            ourPrice: Number(itemData.ourPrice) || 0,
            barcode: itemData.barcode,
            brand: itemData.brand,
            warehouseNo: itemData.warehouseNo,
            tax: Number(itemData.tax) || 0,
            discount: Number(itemData.discount) || 0,
            expireDate: itemData.expireDate,
        };

        onAdd(itemPayload);
    };

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
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-50 flex max-h-[90vh] w-full max-w-4xl flex-col transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Add GRN Item
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Search for an existing product to attach it to the current GRN.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-6">
                    <form id="create-grn-item-form" onSubmit={handleSubmit} className="space-y-8">
                        <section>
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
                                                <li key={p.id || p.mysqlId} onMouseDown={() => selectProduct(p)} className="cursor-pointer px-3 py-2 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800">
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
                                                <li key={v.id || v.mysqlId} onMouseDown={() => selectVariation(v)} className="cursor-pointer px-3 py-2 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800">
                                                    {v.variation}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
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
                    <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="create-grn-item-form" className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">
                        Add to GRN
                    </button>
                </div>
            </div>
        </div>
    );
}
