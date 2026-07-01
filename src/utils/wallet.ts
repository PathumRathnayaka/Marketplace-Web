import { walletApi } from '../services/api';

// Apply a signed change to a customer's wallet balance (negative deducts, positive credits).
// Finds the wallet by customerId or contact; creates one when crediting if none exists.
export async function adjustWallet(customerId: string | undefined, customerContact: string | undefined, delta: number) {
    const wallets = await walletApi.list();
    const existing = wallets.find(
        (w) => (customerId && w.customerId === customerId) || (customerContact && w.customerContact === customerContact)
    );

    if (existing && (existing.id || existing.mysqlId)) {
        const newBalance = Math.max(0, (Number(existing.balance) || 0) + delta);
        await walletApi.update(String(existing.id || existing.mysqlId), { ...existing, balance: newBalance });
        return;
    }

    if (delta > 0) {
        await walletApi.create({ customerId, customerContact, balance: delta });
    }
}
