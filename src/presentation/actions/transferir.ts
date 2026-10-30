"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parseTransferAmount } from "@/domain/request-transfer";
import { executeEnviarSaldo } from "@/data/index";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function transferirAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();

    const amount = parseTransferAmount(formData.get("amountReais"));
    if (!amount.ok) return { ok: false, message: messageFor(amount.error) };

    const result = await executeEnviarSaldo({
      employeeId: formData.get("employeeId"),
      kind: formData.get("kind"),
      amountCents: amount.value,
      idempotencyKey: formData.get("idempotencyKey"),
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };

    revalidatePath("/admin");
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/extrato");
    revalidatePath("/admin/colaboradores");
    revalidatePath("/campo");
    return { ok: true, message: "Valor enviado. Saiu do saldo da empresa e entrou na subconta." };
  } catch (error: unknown) {
    return failAction(error);
  }
}
