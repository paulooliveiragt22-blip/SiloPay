import type { ReceiptCategory } from "./receipt";

export type ReviewReceiptPort = {
  reviewReceipt(input: { receiptId: string; approvedCents: number }): Promise<unknown>;
};

export type SubmitReceiptPort = {
  submitReceipt(input: {
    amountCents: number;
    category: ReceiptCategory;
    storagePath: string;
    placeNote: string | null;
  }): Promise<unknown>;
};
