import { parsePositiveCents } from "./money";
import { parseCategory, parsePlaceNote, parseReceiptPhotoPath, type ReceiptCategory } from "./receipt";
import { err, ok, type Result } from "./result";
import { parseUuid } from "./rpc";

export type CorrigirComprovantePort = {
  corrigirComprovante(input: {
    receiptId: string;
    amountCents: number;
    category: ReceiptCategory;
    placeNote: string | null;
    storagePath: string | null;
  }): Promise<unknown>;
};

export type ExcluirComprovantePort = {
  excluirComprovante(receiptId: string): Promise<unknown>;
};

export async function corrigirComprovante(
  port: CorrigirComprovantePort,
  input: {
    receiptId: unknown;
    amountCents: unknown;
    category: unknown;
    storagePath: unknown;
    placeNote: unknown;
    companyId: string;
    employeeId: string;
  },
): Promise<Result<{ receiptId: string }>> {
  const receiptId = parseUuid(input.receiptId);
  if (!receiptId.ok) return receiptId;
  const amount = parsePositiveCents(input.amountCents);
  if (!amount.ok) return amount;
  const category = parseCategory(input.category);
  if (!category.ok) return category;
  const placeNote = parsePlaceNote(input.placeNote);
  if (!placeNote.ok) return placeNote;

  let storagePath: string | null = null;
  if (typeof input.storagePath === "string" && input.storagePath.trim().length > 0) {
    const path = parseReceiptPhotoPath(input.storagePath, {
      companyId: input.companyId,
      employeeId: input.employeeId,
    });
    if (!path.ok) return path;
    storagePath = path.value;
  }

  const raw = await port.corrigirComprovante({
    receiptId: receiptId.value,
    amountCents: amount.value,
    category: category.value,
    placeNote: placeNote.value,
    storagePath,
  });
  return parseReceiptAck(raw);
}

export async function excluirComprovante(
  port: ExcluirComprovantePort,
  receiptId: unknown,
): Promise<Result<{ receiptId: string }>> {
  const id = parseUuid(receiptId);
  if (!id.ok) return id;
  return parseReceiptAck(await port.excluirComprovante(id.value));
}

function parseReceiptAck(raw: unknown): Result<{ receiptId: string }> {
  if (!raw || typeof raw !== "object" || !("receipt_id" in raw)) return err("retorno_rpc_invalido");
  const receiptId = parseUuid((raw as { receipt_id: unknown }).receipt_id);
  if (!receiptId.ok) return err("retorno_rpc_invalido");
  return ok({ receiptId: receiptId.value });
}
