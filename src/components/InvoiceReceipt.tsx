import { formatDateTime, formatMoney } from '../utils/format';
import { InvoiceSettings } from '../types/pos';

export interface ReceiptItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    ourPrice: number;
    subtotal: number;
}

export interface ReceiptData {
    saleId: string;
    date: string;
    customerContact?: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    walletApplied: number;
    cashPaid: number;
    change: number;
    paymentMethod: string;
    invoiceSettings?: InvoiceSettings | null;
}

interface InvoiceReceiptProps {
    data: ReceiptData | null;
}

const DEFAULT_FOOTER = ['Thank you for your business!', 'Please come again!'];

// Rendered off-screen at all times; only becomes visible via the `print:` variant
// when the browser's print dialog is triggered — sized for an 80mm thermal roll
// (see the `@page` rule in index.css).
export function InvoiceReceipt({ data }: InvoiceReceiptProps) {
    if (!data) return null;

    const settings = data.invoiceSettings;
    const shopName = settings?.shopName || 'POS SYSTEM';
    const footerLines = settings?.footerMessage
        ? settings.footerMessage.split('\n').map((l) => l.trim()).filter(Boolean)
        : DEFAULT_FOOTER;

    const profit = data.items.reduce((sum, item) => sum + (item.unitPrice - item.ourPrice) * item.quantity, 0);

    return (
        <div className="hidden print:block print:w-[80mm] print:bg-white print:p-2 print:font-mono print:text-[11px] print:text-black">
            <div className="text-center">
                <p className="text-base font-bold uppercase">{shopName}</p>
                {settings?.slogan && <p>{settings.slogan}</p>}
                {settings?.address && <p>{settings.address}</p>}
                {settings?.tel && <p>Tel: {settings.tel}</p>}
                {settings?.email && <p>{settings.email}</p>}
            </div>
            <div className="my-1 border-t border-dashed border-black" />

            <p>Date: {formatDateTime(data.date)}</p>
            <p>Inv #: {data.saleId}</p>
            {data.customerContact && <p>Customer: {data.customerContact}</p>}
            <div className="my-1 border-t border-dashed border-black" />

            <table className="w-full">
                <thead>
                    <tr>
                        <th className="text-left font-normal">Item</th>
                        <th className="text-right font-normal">Qty</th>
                        <th className="text-right font-normal">MRP</th>
                        <th className="text-right font-normal">Our</th>
                        <th className="text-right font-normal">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.productName}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                            <td className="text-right">{item.ourPrice.toFixed(2)}</td>
                            <td className="text-right">{item.subtotal.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="my-1 border-t border-dashed border-black" />
            <div className="flex justify-between"><span>SUBTOTAL</span><span>{formatMoney(data.subtotal)}</span></div>
            <div className="flex justify-between"><span>TAX (LKR)</span><span>{formatMoney(data.tax)}</span></div>
            {data.discount > 0 && (
                <div className="flex justify-between"><span>DISCOUNT</span><span>-{formatMoney(data.discount)}</span></div>
            )}
            <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{formatMoney(data.total)}</span></div>

            <div className="my-1 border-t border-dashed border-black" />
            {data.walletApplied > 0 && (
                <div className="flex justify-between"><span>WALLET APPLIED</span><span>-{formatMoney(data.walletApplied)}</span></div>
            )}
            <div className="flex justify-between"><span>PAID</span><span>{formatMoney(data.cashPaid)}</span></div>
            <div className="flex justify-between"><span>CHANGE</span><span>{formatMoney(data.change)}</span></div>

            <div className="my-1 border-t border-dashed border-black" />
            <p className="text-center font-bold">The profit you earned from this bill = {profit.toFixed(2)}</p>

            <div className="mt-2 text-center italic">
                {footerLines.map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </div>

            <div className="mt-3 text-center text-[9px] text-slate-500">
                <p>powered by QALDRIN</p>
                <p>www.qaldrin.com</p>
            </div>
        </div>
    );
}
