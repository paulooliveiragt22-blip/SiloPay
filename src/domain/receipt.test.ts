import assert from "node:assert/strict";
import test from "node:test";
import { parseCategory, parsePlaceNote, parseReceiptPhotoPath, RECEIPT_CATEGORIES } from "./receipt";

test("categoria aceita a lista fechada", () => {
  for (const category of RECEIPT_CATEGORIES) {
    assert.deepEqual(parseCategory(category), { ok: true, value: category });
  }
});

test("categoria rejeita texto fora da lista", () => {
  assert.deepEqual(parseCategory("comida"), { ok: false, error: "categoria_invalida" });
  assert.deepEqual(parseCategory(" Combustivel "), { ok: false, error: "categoria_invalida" });
});

const companyId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";
const fileId = "44444444-4444-4444-8444-444444444444";

test("foto do comprovante fica na pasta da empresa e do funcionário", () => {
  const path = `${companyId}/${employeeId}/${fileId}.jpg`;
  assert.deepEqual(parseReceiptPhotoPath(path, { companyId, employeeId }), { ok: true, value: path });
  assert.deepEqual(parseReceiptPhotoPath(` ${path.toUpperCase()} `, { companyId, employeeId }), {
    ok: true,
    value: path,
  });
});

test("foto rejeita outro dono, caminho relativo e extensão fora da lista", () => {
  const owner = { companyId, employeeId };
  assert.equal(parseReceiptPhotoPath(`${companyId}/33333333-3333-4333-8333-333333333333/${fileId}.jpg`, owner).ok, false);
  assert.equal(parseReceiptPhotoPath(`${companyId}/${employeeId}/../${fileId}.jpg`, owner).ok, false);
  assert.equal(parseReceiptPhotoPath(`${companyId}/${employeeId}/${fileId}.gif`, owner).ok, false);
  assert.equal(parseReceiptPhotoPath("", owner).ok, false);
});

test("observação é opcional e cabe em 200 caracteres", () => {
  assert.deepEqual(parsePlaceNote("  "), { ok: true, value: null });
  assert.deepEqual(parsePlaceNote("placa ABC1D23"), { ok: true, value: "placa ABC1D23" });
  assert.deepEqual(parsePlaceNote("x".repeat(201)), { ok: false, error: "observacao_invalida" });
});
