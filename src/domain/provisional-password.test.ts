import assert from "node:assert/strict";
import test from "node:test";
import {
  generateProvisionalPassword,
  parseEmployeeWithAccess,
  parseNewPassword,
  provisionalExpiresAt,
} from "./provisional-password";

test("cadastro com acesso exige e-mail e normaliza", () => {
  const result = parseEmployeeWithAccess({
    name: " Ana ",
    cpf: "123.456.789-09",
    pixKeyType: "cpf",
    pixKey: "12345678909",
    email: " Ana@Empresa.com ",
    jobTitle: "Operador",
    phone: "(11) 98888-7777",
    postalCode: "01001-000",
    street: "Praça da Sé",
    streetNumber: "100",
    complement: "",
    district: "Sé",
    city: "São Paulo",
    state: "sp",
    hiredOn: "2026-03-01",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.email, "ana@empresa.com");
    assert.equal(result.value.phone, "11988887777");
    assert.equal(result.value.hiredOn, "2026-03-01");
  }
});

test("senha temporária tem 16 caracteres do alfabeto e vence em 24 horas", () => {
  const password = generateProvisionalPassword();
  assert.match(password, /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789]{16}$/);
  const now = new Date("2026-10-30T12:00:00.000Z");
  assert.equal(provisionalExpiresAt(now).toISOString(), "2026-10-31T12:00:00.000Z");
});

test("senha nova exige confirmação, letra, número e diferença da temporária", () => {
  assert.equal(
    parseNewPassword({ next: "nova-senha-1", confirm: "outra", current: "temp", email: "a@b.co" }).ok,
    false,
  );
  assert.equal(
    parseNewPassword({ next: "curta1", confirm: "curta1", current: "temp", email: "a@b.co" }).ok,
    false,
  );
  assert.deepEqual(
    parseNewPassword({ next: "nova-senha-1", confirm: "nova-senha-1", current: "temp", email: "a@b.co" }),
    { ok: true, value: "nova-senha-1" },
  );
  assert.equal(
    parseNewPassword({ next: "nova-senha-1", confirm: "nova-senha-1", current: "nova-senha-1", email: "a@b.co" }).ok,
    false,
  );
});
