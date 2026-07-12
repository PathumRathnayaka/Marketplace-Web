import { grnApi, inventoryApi } from '../services/api';

// Codes are unique per shop. Both endpoints are tenant-scoped, so everything they
// return already belongs to this shop — the max sequence we find here is this
// shop's last code, and the next one continues from it.
export interface ShopCodes {
  grnCodes: string[];
  invoiceNos: string[];
  batchCodes: string[];
}

export async function loadShopCodes(): Promise<ShopCodes> {
  const [grns, batches] = await Promise.all([
    grnApi.list().catch(() => []),
    inventoryApi.listBatches().catch(() => []),
  ]);

  const grnCodes: string[] = [];
  const invoiceNos: string[] = [];
  const batchCodes: string[] = [];

  grns.forEach((grn) => {
    if (grn.grnCode) grnCodes.push(grn.grnCode);
    if (grn.invoiceNo) invoiceNos.push(grn.invoiceNo);
    (grn.items || []).forEach((item) => {
      if (item.batchCode) batchCodes.push(item.batchCode);
    });
  });
  batches.forEach((batch) => {
    if (batch.batchCode) batchCodes.push(batch.batchCode);
  });

  return { grnCodes, invoiceNos, batchCodes };
}

// Highest trailing sequence among the shop's codes carrying this prefix, + 1.
// Codes that don't fit the pattern (a supplier's own invoice number, a hand-typed
// "BCH-AUG-1") are ignored rather than blocking generation.
export function nextCode(prefix: string, existing: string[], pad = 4): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  let highest = 0;
  existing.forEach((code) => {
    const match = pattern.exec(code.trim());
    if (match) highest = Math.max(highest, Number(match[1]));
  });
  return `${prefix}-${String(highest + 1).padStart(pad, '0')}`;
}

export function isTaken(code: string, existing: string[]): boolean {
  const target = code.trim().toLowerCase();
  return existing.some((value) => value.trim().toLowerCase() === target);
}

// Re-checked against a fresh read just before saving: another cashier in the same
// shop may have burned the generated code while this form sat open.
export async function findCodeConflicts(header: {
  grnCode: string;
  invoiceNo: string;
  batchCode: string;
}): Promise<string[]> {
  const codes = await loadShopCodes();
  const conflicts: string[] = [];
  if (isTaken(header.grnCode, codes.grnCodes)) conflicts.push(`GRN code "${header.grnCode}"`);
  if (isTaken(header.invoiceNo, codes.invoiceNos)) conflicts.push(`Invoice no "${header.invoiceNo}"`);
  if (isTaken(header.batchCode, codes.batchCodes)) conflicts.push(`Batch code "${header.batchCode}"`);
  return conflicts;
}
