import { parseEmployeeRegistration } from "./employee";
import type { CadastrarFuncionarioPort } from "./ports";
import type { Result } from "./result";
import { parseCadastrarFuncionario, type CadastrarFuncionarioResult } from "./rpc";

export async function cadastrarFuncionario(
  port: CadastrarFuncionarioPort,
  input: { name: unknown; cpf: unknown; pixKeyType: unknown; pixKey: unknown },
): Promise<Result<CadastrarFuncionarioResult>> {
  const registration = parseEmployeeRegistration(input);
  if (!registration.ok) return registration;
  const raw = await port.cadastrarFuncionario(registration.value);
  return parseCadastrarFuncionario(raw);
}
