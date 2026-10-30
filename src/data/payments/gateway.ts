import type { PaymentKind } from "@/domain/payment";

export type TransferOutcome = "confirmed" | "failed" | "cancelled";

export type PaymentAdapter = {
  provider: string;
  sendTransfer(input: {
    orderId: string;
    kind: PaymentKind;
    amountCents: number;
    pixKeyType: string;
    pixKey: string;
    externalAccountId: string;
    environment: "sandbox" | "producao";
    apiKey: string;
    webhookSecret: string;
  }): Promise<{ providerTransferId: string }>;
  normalizeWebhook(body: unknown): { orderId: string; outcome: TransferOutcome; providerTransferId: string } | null;
};

const adapters = new Map<string, PaymentAdapter>();

export function adapterFor(provider: string): PaymentAdapter | null {
  return adapters.get(provider) ?? null;
}

export function registerAdapter(adapter: PaymentAdapter): void {
  adapters.set(adapter.provider, adapter);
}
