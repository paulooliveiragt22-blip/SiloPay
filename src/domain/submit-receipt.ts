import { parsePositiveCents } from "./money";
import type { SubmitReceiptPort } from "./ports";
import { parseCategory, parsePlaceNote, parseReceiptPhotoPath } from "./receipt";
import { err, type Result } from "./result";
import { parseSubmitReceipt, type SubmitReceiptResult } from "./rpc";

export async function submitReceipt(
  port: SubmitReceiptPort,
  input: {
    amountCents: unknown;
    category: unknown;
    storagePath: unknown;
    placeNote: unknown;
    companyId: string;
    employeeId: string;
  },
): Promise<Result<SubmitReceiptResult>> {
  const amount = parsePositiveCents(input.amountCents);
  if (!amount.ok) return amount;
  const category = parseCategory(input.category);
  if (!category.ok) return category;
  const storagePath = parseReceiptPhotoPath(input.storagePath, {
    companyId: input.companyId,
    employeeId: input.employeeId,
  });
  if (!storagePath.ok) return storagePath;
  const placeNote = parsePlaceNote(input.placeNote);
  if (!placeNote.ok) return placeNote;

  const raw = await port.submitReceipt({
    amountCents: amount.value,
    category: category.value,
    storagePath: storagePath.value,
    placeNote: placeNote.value,
  });
  const parsed = parseSubmitReceipt(raw);
  if (!parsed.ok) return parsed;
  if (parsed.value.status !== "em_analise") return err("retorno_rpc_invalido");
  return parsed;
}
