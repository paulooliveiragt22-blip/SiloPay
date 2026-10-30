import assert from "node:assert/strict";
import test from "node:test";
import { decideReview, parsePositiveCents } from "./money";

test("centavos positivos aceitam inteiro maior que zero", () => {
  const parsed = parsePositiveCents(1500);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value, 1500);
});

test("centavos rejeitam fracao, texto e zero", () => {
  assert.deepEqual(parsePositiveCents(10.5), { ok: false, error: "centavos_invalidos" });
  assert.deepEqual(parsePositiveCents("1500"), { ok: false, error: "centavos_invalidos" });
  assert.deepEqual(parsePositiveCents(0), { ok: false, error: "valor_nao_positivo" });
  assert.deepEqual(parsePositiveCents(-1), { ok: false, error: "valor_nao_positivo" });
});

test("baixa fecha aprovado, parcial ou recusado", () => {
  const claimed = parsePositiveCents(1000);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;

  const full = decideReview(claimed.value, 1000);
  const partial = decideReview(claimed.value, 400);
  const rejected = decideReview(claimed.value, 0);

  assert.deepEqual(full, {
    ok: true,
    value: { status: "aprovado", approved: 1000, postsLedger: true },
  });
  assert.deepEqual(partial, {
    ok: true,
    value: { status: "parcial", approved: 400, postsLedger: true },
  });
  assert.deepEqual(rejected, {
    ok: true,
    value: { status: "recusado", approved: 0, postsLedger: false },
  });
});

test("baixa recusa valor acima do informado", () => {
  const claimed = parsePositiveCents(1000);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;
  assert.deepEqual(decideReview(claimed.value, 1001), {
    ok: false,
    error: "valor_aceito_invalido",
  });
});
