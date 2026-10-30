"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parseReaisToCents } from "@/domain/money";
import { executeSubmitReceipt } from "@/data/index";
import { messageFor, messageFromUnknown } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function submitReceiptAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await verifySession();
  const membership = session.membership;
  if (membership?.role !== "funcionario" || !membership.employeeId) forbidden();

  const amount = parseReaisToCents(formData.get("amountReais"));
  if (!amount.ok) return { ok: false, message: messageFor(amount.error) };

  try {
    const result = await executeSubmitReceipt({
      amountCents: amount.value,
      category: formData.get("category"),
      storagePath: formData.get("storagePath"),
      placeNote: formData.get("placeNote"),
      companyId: membership.companyId,
      employeeId: membership.employeeId,
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
  } catch (error: unknown) {
    return { ok: false, message: messageFromUnknown(error) };
  }

  revalidatePath("/admin/comprovantes");
  revalidatePath("/admin");
  revalidatePath("/campo");
  return { ok: true, message: "Comprovante enviado." };
}
