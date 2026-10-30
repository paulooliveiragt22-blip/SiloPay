import type { Cents } from "./money";
import { parseReaisToCents } from "./money";
import { parsePaymentKind, type PaymentKind } from "./payment";
import type { RequestTransferPort } from "./ports";
import type { Result } from "./result";
import { ok } from "./result";
import { parseAbrirOrdem, parseUuid } from "./rpc";

export type TransferRequestResult = {
  paymentOrderId: string;
  status: "pendente" | "confirmada" | "falhou" | "cancelada";
  dispatched: boolean;
};

export async function requestTransfer(
  port: RequestTransferPort,
  input: { employeeId: unknown; kind: unknown; amountCents: Cents; idempotencyKey: unknown },
): Promise<Result<TransferRequestResult>> {
  const employeeId = parseUuid(input.employeeId);
  if (!employeeId.ok) return employeeId;
  const kind = parsePaymentKind(input.kind);
  if (!kind.ok) return kind;
  const idempotencyKey = parseUuid(input.idempotencyKey);
  if (!idempotencyKey.ok) return idempotencyKey;

  const opened = parseAbrirOrdem(await port.openOrder({
    employeeId: employeeId.value,
    kind: kind.value,
    amountCents: input.amountCents,
    idempotencyKey: idempotencyKey.value,
  }));
  if (!opened.ok) return opened;
  if (opened.value.status !== "pendente") {
    return ok({
      paymentOrderId: opened.value.paymentOrderId,
      status: opened.value.status,
      dispatched: opened.value.status === "confirmada",
    });
  }

  const dispatch = await port.dispatch({ orderId: opened.value.paymentOrderId, kind: kind.value });
  if (!dispatch.sent) {
    await port.failOrder(opened.value.paymentOrderId);
    return ok({ paymentOrderId: opened.value.paymentOrderId, status: "falhou", dispatched: false });
  }

  await port.markSent({
    orderId: opened.value.paymentOrderId,
    providerTransferId: dispatch.providerTransferId,
  });
  return ok({ paymentOrderId: opened.value.paymentOrderId, status: "pendente", dispatched: true });
}

export function parseTransferAmount(raw: unknown): Result<Cents> {
  return parseReaisToCents(raw);
}

export type { PaymentKind };
