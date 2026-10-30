"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parseReaisToCents } from "@/domain/money";
import { executeCorrigirComprovante, executeExcluirComprovante } from "@/data/index";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

function revalidateReceipts() {
  revalidatePath("/admin/comprovantes");
  revalidatePath("/admin");
  revalidatePath("/admin/colaboradores");
  revalidatePath("/campo");
}

async function requireEmployee() {
  const session = await verifySession();
  const membership = session.membership;
  const employeeId = membership?.role === "funcionario" ? membership.employeeId : null;
  if (!membership || !employeeId) forbidden();
  return { companyId: membership.companyId, employeeId };
}

export async function corrigirComprovanteAction(input: {
  receiptId: string;
  amountReais: string;
  category: string;
  placeNote: string;
  storagePath: string | null;
}): Promise<ActionResult> {
  try {
    const membership = await requireEmployee();
    const amount = parseReaisToCents(input.amountReais);
    if (!amount.ok) return { ok: false, message: messageFor(amount.error) };
    const result = await executeCorrigirComprovante({
      receiptId: input.receiptId,
      amountCents: amount.value,
      category: input.category,
      storagePath: input.storagePath,
      placeNote: input.placeNote,
      companyId: membership.companyId,
      employeeId: membership.employeeId,
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidateReceipts();
    return { ok: true, message: "Comprovante atualizado." };
  } catch (error: unknown) {
    return failAction(error);
  }
}

export async function excluirComprovanteAction(receiptId: string): Promise<ActionResult> {
  try {
    await requireEmployee();
    const result = await executeExcluirComprovante(receiptId);
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidateReceipts();
    return { ok: true, message: "Comprovante excluído." };
  } catch (error: unknown) {
    return failAction(error);
  }
}
