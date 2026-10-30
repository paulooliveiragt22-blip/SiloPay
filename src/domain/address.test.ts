import assert from "node:assert/strict";
import test from "node:test";
import { parseCepDigits, parseEmployeeProfile, parsePostalLookup } from "./address";

const profile = {
  jobTitle: " Operador ",
  phone: "+55 (11) 98888-7777",
  postalCode: "01001-000",
  street: "Praça da Sé",
  streetNumber: "100",
  complement: "  ",
  district: "Sé",
  city: "São Paulo",
  state: "sp",
  hiredOn: "",
};

test("cadastro normaliza telefone, CEP e UF e deixa a admissão vazia", () => {
  const result = parseEmployeeProfile(profile);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.jobTitle, "Operador");
  assert.equal(result.value.phone, "11988887777");
  assert.equal(result.value.postalCode, "01001000");
  assert.equal(result.value.state, "SP");
  assert.equal(result.value.complement, null);
  assert.equal(result.value.hiredOn, null);
});

test("admissão inválida e telefone curto são recusados", () => {
  assert.equal(parseEmployeeProfile({ ...profile, hiredOn: "2026-02-31" }).ok, false);
  assert.equal(parseEmployeeProfile({ ...profile, phone: "119888" }).ok, false);
  assert.equal(parseCepDigits("123").ok, false);
});

test("consulta de CEP aceita rua vazia e recusa CEP inexistente", () => {
  assert.deepEqual(
    parsePostalLookup({ logradouro: "", bairro: "Sé", localidade: "São Paulo", uf: "sp" }),
    { ok: true, value: { street: "", district: "Sé", city: "São Paulo", state: "SP" } },
  );
  assert.deepEqual(parsePostalLookup({ erro: true }), { ok: false, error: "cep_nao_encontrado" });
});
