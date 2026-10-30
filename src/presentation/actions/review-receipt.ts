"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parsePositiveCents, parseReaisToCents } from "@/domain/money";
import { executeReviewReceipt } from "@/data/index";
import { messageFor, messageFromUnknown } from "../messages";
import { verifySession } from "../session";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function reviewReceiptAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await verifySession();
  if (session.membership?.role !== "admin") forbidden();

  const claimed = parsePositiveCents(numberFromDigits(formData.get("claimedCents")));
  if (!claimed.ok) return { ok: false, message: messageFor(claimed.error) };
  const approved = parseReaisToCents(formData.get("approvedReais"));
  if (!approved.ok) return { ok: false, message: messageFor(approved.error) };

  try {
    const result = await executeReviewReceipt({
      receiptId: String(formData.get("receiptId") ?? ""),
      claimed: claimed.value,
      approved: approved.value,
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
  } catch (error: unknown) {
    return { ok: false, message: messageFromUnknown(error) };
  }

  revalidatePath("/admin/comprovantes");
  revalidatePath("/admin");
  revalidatePath("/campo");
  return { ok: true, message: "Baixa registrada." };
}

function numberFromDigits(value: FormDataEntryValue | null): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return Number.NaN;
  return Number(value);
}
