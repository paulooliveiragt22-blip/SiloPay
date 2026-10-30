import assert from "node:assert/strict";
import test from "node:test";
import { parsePositiveCents } from "./money";
import type { ReviewReceiptPort } from "./ports";
import { reviewReceipt } from "./review-receipt";

const receiptId = "44444444-4444-4444-8444-444444444444";

test("baixa valida a faixa antes de chamar a porta", async () => {
  let called = 0;
  const port: ReviewReceiptPort = {
    async reviewReceipt() {
      called += 1;
      return {};
    },
  };
  const claimed = parsePositiveCents(1000);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;

  const result = await reviewReceipt(port, { receiptId, claimed: claimed.value, approved: 1001 });
  assert.deepEqual(result, { ok: false, error: "valor_aceito_invalido" });
  assert.equal(called, 0);
});

test("baixa devolve o retorno da porta quando o status confere", async () => {
  const port: ReviewReceiptPort = {
    async reviewReceipt(input) {
      return {
        receipt_id: input.receiptId,
        status: "parcial",
        amount_approved_cents: input.approvedCents,
      };
    },
  };
  const claimed = parsePositiveCents(1000);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;

  const result = await reviewReceipt(port, { receiptId, claimed: claimed.value, approved: 400 });
  assert.deepEqual(result, {
    ok: true,
    value: { receiptId, status: "parcial", amountApprovedCents: 400 },
  });
});
