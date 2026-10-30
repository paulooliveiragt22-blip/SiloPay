import assert from "node:assert/strict";
import test from "node:test";
import { parseCategory, RECEIPT_CATEGORIES } from "./receipt";

test("categoria aceita a lista fechada", () => {
  for (const category of RECEIPT_CATEGORIES) {
    assert.deepEqual(parseCategory(category), { ok: true, value: category });
  }
});

test("categoria rejeita texto fora da lista", () => {
  assert.deepEqual(parseCategory("comida"), { ok: false, error: "categoria_invalida" });
  assert.deepEqual(parseCategory(" Combustivel "), { ok: false, error: "categoria_invalida" });
});
