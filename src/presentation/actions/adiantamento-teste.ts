"use server";

import { forbidden } from "next/navigation";
import { failAction } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function adiantamentoTesteAction(
  _previous: ActionResult | null,
  _formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();
    return {
      ok: false,
      message: "O lançamento de teste saiu. Adicione saldo na empresa e envie a partir dele.",
    };
  } catch (error: unknown) {
    return failAction(error);
  }
}
