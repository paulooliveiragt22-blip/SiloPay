import assert from "node:assert/strict";
import test from "node:test";
import { cadastrarFuncionario } from "./cadastrar-funcionario";
import type { CadastrarFuncionarioPort } from "./ports";

const employeeId = "22222222-2222-4222-8222-222222222222";

test("cadastro válido pede a RPC com CPF só de dígitos", async () => {
  const calls: unknown[] = [];
  const port: CadastrarFuncionarioPort = {
    async cadastrarFuncionario(input) {
      calls.push(input);
      return { employee_id: employeeId };
    },
  };
  const result = await cadastrarFuncionario(port, {
    name: "  Marcio Silva ",
    cpf: "123.456.789-09",
    pixKeyType: "email",
    pixKey: " marcio@exemplo.com ",
  });
  assert.deepEqual(result, { ok: true, value: { employeeId } });
  assert.deepEqual(calls, [
    {
      name: "Marcio Silva",
      cpf: "12345678909",
      pixKeyType: "email",
      pixKey: "marcio@exemplo.com",
    },
  ]);
});

test("cadastro rejeita CPF curto e não chama a RPC", async () => {
  let called = false;
  const port: CadastrarFuncionarioPort = {
    async cadastrarFuncionario() {
      called = true;
      return {};
    },
  };
  const result = await cadastrarFuncionario(port, {
    name: "Marcio",
    cpf: "123",
    pixKeyType: "cpf",
    pixKey: "123",
  });
  assert.deepEqual(result, { ok: false, error: "cpf_invalido" });
  assert.equal(called, false);
});
