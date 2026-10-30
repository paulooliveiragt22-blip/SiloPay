import type { ReceiptCategory } from "./receipt";
import type { EmployeeRegistration } from "./employee";
import type { PaymentKind } from "./payment";

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

export type CadastrarFuncionarioPort = {
  cadastrarFuncionario(input: EmployeeRegistration): Promise<unknown>;
};

export type DispatchResult = { sent: false } | { sent: true; providerTransferId: string };

export type RequestTransferPort = {
  openOrder(input: {
    employeeId: string;
    kind: PaymentKind;
    amountCents: number;
    idempotencyKey: string;
  }): Promise<unknown>;
  dispatch(input: { orderId: string; kind: PaymentKind }): Promise<DispatchResult>;
  failOrder(orderId: string): Promise<unknown>;
  markSent(input: { orderId: string; providerTransferId: string }): Promise<unknown>;
};
