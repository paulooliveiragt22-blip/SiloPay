import { PIX_KEY_TYPES, type PixKeyType } from "@/domain/employee";

const labels: Record<PixKeyType, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  phone: "Celular",
  evp: "Chave aleatória",
};

export const pixKeyOptions = PIX_KEY_TYPES.map((value) => ({
  value,
  label: labels[value],
}));
