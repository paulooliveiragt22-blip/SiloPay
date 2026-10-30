"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parseReaisToCents } from "@/domain/money";
import { executeDevolverSobra } from "@/data/index";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function devolverSobraAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();

    const amount = parseReaisToCents(formData.get("amountReais"));
    if (!amount.ok) return { ok: false, message: messageFor(amount.error) };

    const result = await executeDevolverSobra({
      employeeId: formData.get("employeeId"),
      amountCents: amount.value,
      idempotencyKey: formData.get("idempotencyKey"),
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };

    revalidatePath("/admin");
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/extrato");
    revalidatePath("/admin/colaboradores");
    revalidatePath("/campo");
    return { ok: true, message: "Devolução registrada. Saiu da subconta e voltou para a empresa." };
  } catch (error: unknown) {
    return failAction(error);
  }
}
