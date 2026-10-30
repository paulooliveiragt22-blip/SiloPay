import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAdiantamentoTeste,
  parseCadastrarFuncionario,
  parseCriarEmpresa,
  parseReviewReceipt,
  parseSubmitReceipt,
  parseVincularFuncionario,
} from "./rpc";

const companyId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const receiptId = "44444444-4444-4444-8444-444444444444";
const orderId = "55555555-5555-4555-8555-555555555555";

test("parsers das RPCs aceitam o jsonb do banco", () => {
  assert.deepEqual(parseCriarEmpresa({ company_id: companyId }), {
    ok: true,
    value: { companyId },
  });
  assert.deepEqual(parseCadastrarFuncionario({ employee_id: employeeId }), {
    ok: true,
    value: { employeeId },
  });
  assert.deepEqual(parseVincularFuncionario({ employee_id: employeeId, user_id: userId }), {
    ok: true,
    value: { employeeId, userId },
  });
  assert.deepEqual(parseSubmitReceipt({ receipt_id: receiptId, status: "em_analise" }), {
    ok: true,
    value: { receiptId, status: "em_analise" },
  });
  assert.deepEqual(
    parseReviewReceipt({
      receipt_id: receiptId,
      status: "parcial",
      amount_approved_cents: 400,
    }),
    { ok: true, value: { receiptId, status: "parcial", amountApprovedCents: 400 } },
  );
  assert.deepEqual(parseAdiantamentoTeste({ payment_order_id: orderId, idempotent: true }), {
    ok: true,
    value: { paymentOrderId: orderId, idempotent: true },
  });
});

test("parser da baixa recusa status que nao bate com o valor", () => {
  assert.deepEqual(
    parseReviewReceipt({
      receipt_id: receiptId,
      status: "recusado",
      amount_approved_cents: 10,
    }),
    { ok: false, error: "retorno_rpc_invalido" },
  );
});

test("parser rejeita jsonb incompleto", () => {
  assert.deepEqual(parseCriarEmpresa({ company_id: "nao-e-uuid" }), {
    ok: false,
    error: "retorno_rpc_invalido",
  });
  assert.deepEqual(parseSubmitReceipt({ receipt_id: receiptId, status: "aprovado" }), {
    ok: false,
    error: "retorno_rpc_invalido",
  });
});
