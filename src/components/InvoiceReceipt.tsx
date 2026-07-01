import { formatDateTime, formatMoney } from '../utils/format';

export interface ReceiptItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface ReceiptData {
    saleId: string;
    date: string;
    cashierName?: string;
    customerContact?: string;
    items: ReceiptItem[];
    subtotal: number;
    discount: number;
    total: number;
    walletApplied: number;
    cashPaid: number;
    change: number;
    paymentMethod: string;
}

interface InvoiceReceiptProps {
    data: ReceiptData | null;
}

// Rendered off-screen at all times; only becomes visible via the `print:` variant
// when the browser's print dialog is triggered — sized for an 80mm thermal roll
// (see the `@page` rule in index.css).
export function InvoiceReceipt({ data }: InvoiceReceiptProps) {
    if (!data) return null;

    return (
        <div className="hidden print:block print:w-[80mm] print:bg-white print:p-2 print:font-mono print:text-[11px] print:text-black">
            <div className="text-center">
                <p className="text-sm font-bold">Qal POS</p>
                <p>Sales Receipt</p>
            </div>
            <div className="my-1 border-t border-dashed border-black" />
            <p>Invoice: {data.saleId}</p>
            <p>Date: {formatDateTime(data.date)}</p>
            {data.cashierName && <p>Cashier: {data.cashierName}</p>}
            {data.customerContact && <p>Customer: {data.customerContact}</p>}
            <div className="my-1 border-t border-dashed border-black" />

            <table className="w-full">
                <thead>
                    <tr>
                        <th className="text-left font-normal">Item</th>
                        <th className="text-right font-normal">Qty</th>
                        <th className="text-right font-normal">Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.productName}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">{item.subtotal.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="my-1 border-t border-dashed border-black" />
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(data.subtotal)}</span></div>
            {data.discount > 0 && (
                <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(data.discount)}</span></div>
            )}
            <div className="flex justify-between font-bold"><span>Total</span><span>{formatMoney(data.total)}</span></div>
            {data.walletApplied > 0 && (
                <div className="flex justify-between"><span>Wallet applied</span><span>-{formatMoney(data.walletApplied)}</span></div>
            )}
            <div className="flex justify-between"><span>Paid ({data.paymentMethod})</span><span>{formatMoney(data.cashPaid)}</span></div>
            <div className="flex justify-between"><span>Change</span><span>{formatMoney(data.change)}</span></div>

            <div className="my-1 border-t border-dashed border-black" />
            <p className="mt-2 text-center">Thank you! Come again.</p>
        </div>
    );
}
