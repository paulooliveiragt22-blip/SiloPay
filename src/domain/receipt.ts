import { parseUuid } from "./rpc";
import { err, ok, type Result } from "./result";

export const RECEIPT_PHOTO_MAX_BYTES = 5_242_880;

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

const PHOTO_FILE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/;

export function parsePlaceNote(value: unknown): Result<string | null> {
  if (value === null || value === undefined) return ok(null);
  if (typeof value !== "string") return err("observacao_invalida");
  const note = value.trim();
  if (note.length === 0) return ok(null);
  if (note.length > 200) return err("observacao_invalida");
  return ok(note);
}

export function parseReceiptPhotoPath(
  value: unknown,
  owner: { companyId: string; employeeId: string },
): Result<string> {
  const companyId = parseUuid(owner.companyId);
  const employeeId = parseUuid(owner.employeeId);
  if (!companyId.ok || !employeeId.ok || typeof value !== "string") return err("foto_invalida");
  const path = value.trim().toLowerCase();
  const prefix = `${companyId.value.toLowerCase()}/${employeeId.value.toLowerCase()}/`;
  const file = path.startsWith(prefix) ? path.slice(prefix.length) : "";
  if (file.length === 0 || file.includes("/") || !PHOTO_FILE.test(file)) return err("foto_invalida");
  return ok(path);
}

function isCategory(value: unknown): value is ReceiptCategory {
  return RECEIPT_CATEGORIES.some((category) => category === value);
}
