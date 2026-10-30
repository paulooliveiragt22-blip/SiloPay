import { err, ok, type Result } from "./result";

export const RECEIPT_CATEGORIES = [
  "combustivel",
  "alimentacao",
  "pedagio",
  "hospedagem",
  "manutencao",
  "insumos",
  "frete",
  "outros",
] as const;

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];

export function parseCategory(value: unknown): Result<ReceiptCategory> {
  if (!isCategory(value)) return err("categoria_invalida");
  return ok(value);
}

function isCategory(value: unknown): value is ReceiptCategory {
  return RECEIPT_CATEGORIES.some((category) => category === value);
}
