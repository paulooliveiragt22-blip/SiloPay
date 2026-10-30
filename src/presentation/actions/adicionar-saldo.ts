"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parseReaisToCents } from "@/domain/money";
import { parseUuid } from "@/domain/rpc";
import { executeAdicionarSaldo } from "@/data/index";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function adicionarSaldoAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();

    const amount = parseReaisToCents(formData.get("amountReais"));
    if (!amount.ok) return { ok: false, message: messageFor(amount.error) };
    const idempotencyKey = parseUuid(formData.get("idempotencyKey"));
    if (!idempotencyKey.ok) return { ok: false, message: messageFor(idempotencyKey.error) };

    const result = await executeAdicionarSaldo({
      amountCents: amount.value,
      idempotencyKey: idempotencyKey.value,
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };

    revalidatePath("/admin");
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/extrato");
    revalidatePath("/admin/colaboradores");
    return { ok: true, message: "Saldo adicionado na conta da empresa." };
  } catch (error: unknown) {
    return failAction(error);
  }
}
