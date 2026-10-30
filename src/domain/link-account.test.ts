import assert from "node:assert/strict";
import test from "node:test";
import { parseLoginEmail } from "./link-account";

test("e-mail de vínculo aceita conta já escrita e normaliza", () => {
  assert.deepEqual(parseLoginEmail("  Ana@Empresa.com "), { ok: true, value: "ana@empresa.com" });
});

test("e-mail de vínculo rejeita texto sem domínio", () => {
  assert.equal(parseLoginEmail("ana").ok, false);
});
