import assert from "node:assert/strict";
import test from "node:test";
import { parsePositiveCents } from "./money";
import { requestTransfer } from "./request-transfer";
import type { RequestTransferPort } from "./ports";

const employeeId = "22222222-2222-4222-8222-222222222222";
const orderId = "55555555-5555-4555-8555-555555555555";
const idempotencyKey = "66666666-6666-4666-8666-666666666666";

function cents(value: number) {
  const parsed = parsePositiveCents(value);
  if (!parsed.ok) throw new Error("centavos");
  return parsed.value;
}

test("sem adaptador a ordem pendente é marcada como falha e o saldo não entra no caso de uso", async () => {
  const calls: string[] = [];
  const port: RequestTransferPort = {
    async openOrder() {
      calls.push("open");
      return { payment_order_id: orderId, status: "pendente", idempotent: false };
    },
    async dispatch() {
      calls.push("dispatch");
      return { sent: false };
    },
    async failOrder() {
      calls.push("fail");
      return { payment_order_id: orderId, status: "falhou" };
    },
    async markSent() {
      calls.push("sent");
      return {};
    },
  };

  const result = await requestTransfer(port, {
    employeeId,
    kind: "adiantamento",
    amountCents: cents(1000),
    idempotencyKey,
  });

  assert.deepEqual(result, { ok: true, value: { paymentOrderId: orderId, status: "falhou", dispatched: false } });
  assert.deepEqual(calls, ["open", "dispatch", "fail"]);
});

test("envio aceito não falha a ordem", async () => {
  const calls: string[] = [];
  const port: RequestTransferPort = {
    async openOrder() {
      return { payment_order_id: orderId, status: "pendente", idempotent: false };
    },
    async dispatch() {
      calls.push("dispatch");
      return { sent: true, providerTransferId: "ext-1" };
    },
    async failOrder() {
      calls.push("fail");
      return {};
    },
    async markSent(input) {
      calls.push(input.providerTransferId);
      return {};
    },
  };

  const result = await requestTransfer(port, {
    employeeId,
    kind: "reembolso",
    amountCents: cents(500),
    idempotencyKey,
  });

  assert.deepEqual(result, { ok: true, value: { paymentOrderId: orderId, status: "pendente", dispatched: true } });
  assert.deepEqual(calls, ["dispatch", "ext-1"]);
});

test("ordem já confirmada não dispara de novo", async () => {
  const calls: string[] = [];
  const result = await requestTransfer(
    {
      async openOrder() {
        return { payment_order_id: orderId, status: "confirmada", idempotent: true };
      },
      async dispatch() {
        calls.push("dispatch");
        return { sent: false };
      },
      async failOrder() {
        calls.push("fail");
        return {};
      },
      async markSent() {
        calls.push("sent");
        return {};
      },
    },
    { employeeId, kind: "adiantamento", amountCents: cents(1000), idempotencyKey },
  );

  assert.deepEqual(result, { ok: true, value: { paymentOrderId: orderId, status: "confirmada", dispatched: true } });
  assert.deepEqual(calls, []);
});

test("tipo inválido não abre ordem", async () => {
  let opened = false;
  const result = await requestTransfer(
    {
      async openOrder() {
        opened = true;
        return {};
      },
      async dispatch() {
        return { sent: false };
      },
      async failOrder() {
        return {};
      },
      async markSent() {
        return {};
      },
    },
    { employeeId, kind: "pix", amountCents: cents(100), idempotencyKey },
  );

  assert.deepEqual(result, { ok: false, error: "tipo_pix_invalido" });
  assert.equal(opened, false);
});
