"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parseApprovedReais, parsePositiveCents } from "@/domain/money";
import { executeReviewReceipt } from "@/data/index";
import { formatCents } from "../format";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function reviewReceiptAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();

    const claimed = parsePositiveCents(numberFromDigits(formData.get("claimedCents")));
    if (!claimed.ok) return { ok: false, message: messageFor(claimed.error) };
    const approved =
      formData.get("intent") === "recusar" ? parseApprovedReais("0") : parseApprovedReais(formData.get("approvedReais"));
    if (!approved.ok) return { ok: false, message: messageFor(approved.error) };

    const result = await executeReviewReceipt({
      receiptId: String(formData.get("receiptId") ?? ""),
      claimed: claimed.value,
      approved: approved.value,
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidatePath("/admin/comprovantes");
    revalidatePath("/admin");
    revalidatePath("/admin/colaboradores");
    revalidatePath("/campo");
    if (result.value.status === "recusado") {
      return { ok: true, message: "Comprovante recusado. Nenhum valor entrou no saldo." };
    }
    return {
      ok: true,
      message: `Baixa registrada. Valor aceito: ${formatCents(result.value.amountApprovedCents)}.`,
    };
  } catch (error: unknown) {
    return failAction(error);
  }
}

function numberFromDigits(value: FormDataEntryValue | null): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return Number.NaN;
  return Number(value);
}
