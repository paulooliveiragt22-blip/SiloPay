import { err, ok, type Result } from "./result";

export const PIX_KEY_TYPES = ["cpf", "cnpj", "email", "phone", "evp"] as const;

export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

export type EmployeeRegistration = {
  name: string;
  cpf: string;
  pixKeyType: PixKeyType;
  pixKey: string;
};

export function parseEmployeeRegistration(input: {
  name: unknown;
  cpf: unknown;
  pixKeyType: unknown;
  pixKey: unknown;
}): Result<EmployeeRegistration> {
  if (typeof input.name !== "string" || input.name.trim().length === 0) return err("nome_invalido");
  const cpf = typeof input.cpf === "string" ? input.cpf.replace(/[^0-9]/g, "") : "";
  if (!/^[0-9]{11}$/.test(cpf)) return err("cpf_invalido");
  if (!isPixKeyType(input.pixKeyType)) return err("chave_pix_invalida");
  if (typeof input.pixKey !== "string" || input.pixKey.trim().length === 0) return err("chave_pix_invalida");
  return ok({
    name: input.name.trim(),
    cpf,
    pixKeyType: input.pixKeyType,
    pixKey: input.pixKey.trim(),
  });
}

function isPixKeyType(value: unknown): value is PixKeyType {
  return PIX_KEY_TYPES.some((type) => type === value);
}
