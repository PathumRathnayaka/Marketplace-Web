import { grnApi, inventoryApi } from '../services/api';
import { ShopOrder } from '../types/orders';

// Order GRNs are saved as PENDING with no inventory batches (see
// CreateGrnPaymentModal's `deferInventory`), because the stock hasn't
// physically arrived yet. Once the supplier marks the matching shop_order as
// DELIVERED, create the batches from the GRN's own saved item data and flip
// the GRN to RECEIVED so it doesn't get reconciled again.
export async function reconcileDeliveredOrderGrns(orders: ShopOrder[]): Promise<number> {
    const deliveredCodes = new Set(
        orders.filter((o) => o.status === 'DELIVERED' && o.grnCode).map((o) => o.grnCode as string)
    );
    if (deliveredCodes.size === 0) return 0;

    const grns = await grnApi.list();
    const pending = grns.filter(
        (g) => g.grnCode && deliveredCodes.has(g.grnCode) && g.status === 'PENDING'
    );

    let created = 0;
    for (const grn of pending) {
        const grnId = grn.mysqlId || grn.id;
        if (!grnId) continue;

        // Flip status first so a concurrent reconcile pass (e.g. a second tab)
        // won't also try to create batches for the same GRN.
        await grnApi.update(grnId, { ...grn, status: 'RECEIVED' });

        for (const item of grn.items || []) {
            await inventoryApi.createBatch({
                productId: item.productId,
                productName: item.productName,
                variationId: item.variationId,
                variationSize: null,
                supplierId: grn.supplierId,
                supplierName: grn.supplierName,
                barcode: item.barcode,
                quantity: item.quantity || 0,
                batchCode: item.batchCode,
                salePrice: item.salePrice || 0,
                purchasePrice: item.purchasePrice || 0,
                ourPrice: item.ourPrice || 0,
                brand: item.brand,
                warehouseNo: item.warehouseNo,
                discount: item.discount || 0,
                tax: item.tax || 0,
                expireDate: item.expireDate,
            });
        }
        created++;
    }
    return created;
}
