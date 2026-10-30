"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parseReaisToCents } from "@/domain/money";
import { parseUuid } from "@/domain/rpc";
import { executeAdiantamentoTeste } from "@/data/index";
import { messageFor, messageFromUnknown } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function adiantamentoTesteAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await verifySession();
  if (session.membership?.role !== "admin") forbidden();

  const employeeId = parseUuid(formData.get("employeeId"));
  if (!employeeId.ok) return { ok: false, message: "Funcionário inválido." };
  const amount = parseReaisToCents(formData.get("amountReais"));
  if (!amount.ok) return { ok: false, message: messageFor(amount.error) };

  try {
    const result = await executeAdiantamentoTeste({
      employeeId: employeeId.value,
      amountCents: amount.value,
      idempotencyKey: `${employeeId.value}:${amount.value}`,
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
  } catch (error: unknown) {
    return { ok: false, message: messageFromUnknown(error) };
  }

  revalidatePath("/admin");
  revalidatePath("/campo");
  return { ok: true, message: "Adiantamento de teste lançado." };
}
