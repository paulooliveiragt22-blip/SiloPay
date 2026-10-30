"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { parsePaymentAccount } from "@/domain/payment";
import { executeConectarConta } from "@/data/index";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function conectarContaAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();

    const parsed = parsePaymentAccount({
      provider: formData.get("provider"),
      externalAccountId: formData.get("externalAccountId"),
      environment: formData.get("environment"),
      apiKey: formData.get("apiKey"),
      webhookSecret: formData.get("webhookSecret"),
    });
    if (!parsed.ok) return { ok: false, message: messageFor(parsed.error) };

    const result = await executeConectarConta(parsed.value);
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/colaboradores");
    revalidatePath("/admin/extrato");
    return { ok: true, message: "Conta de pagamento conectada. A chave não volta para o navegador." };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "cifra ausente") {
      return { ok: false, message: "Falta a chave de cifra no servidor." };
    }
    return failAction(error);
  }
}
