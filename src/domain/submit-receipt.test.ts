import assert from "node:assert/strict";
import test from "node:test";
import type { SubmitReceiptPort } from "./ports";
import { submitReceipt } from "./submit-receipt";

const companyId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const receiptId = "44444444-4444-4444-8444-444444444444";
const storagePath = `${companyId}/${employeeId}/${receiptId}.jpg`;

test("comprovante válido pede a RPC e exige em análise", async () => {
  const calls: unknown[] = [];
  const port: SubmitReceiptPort = {
    async submitReceipt(input) {
      calls.push(input);
      return { receipt_id: receiptId, status: "em_analise" };
    },
  };
  const result = await submitReceipt(port, {
    amountCents: 1500,
    category: "combustivel",
    storagePath,
    placeNote: "  ",
    companyId,
    employeeId,
  });
  assert.deepEqual(result, { ok: true, value: { receiptId, status: "em_analise" } });
  assert.deepEqual(calls, [
    {
      amountCents: 1500,
      category: "combustivel",
      storagePath,
      placeNote: null,
    },
  ]);
});

test("comprovante sem foto não chama a RPC", async () => {
  let called = false;
  const port: SubmitReceiptPort = {
    async submitReceipt() {
      called = true;
      return {};
    },
  };
  const result = await submitReceipt(port, {
    amountCents: 1500,
    category: "combustivel",
    storagePath: "foto.jpg",
    placeNote: null,
    companyId,
    employeeId,
  });
  assert.deepEqual(result, { ok: false, error: "foto_invalida" });
  assert.equal(called, false);
});
