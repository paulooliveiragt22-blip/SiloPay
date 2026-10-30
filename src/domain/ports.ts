export type ReviewReceiptPort = {
  reviewReceipt(input: { receiptId: string; approvedCents: number }): Promise<unknown>;
};
