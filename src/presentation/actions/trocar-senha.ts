"use server";

import { executeTrocarSenhaInicial } from "@/data/auth/employee-access";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";

export type TrocaSenhaResult = { ok: true } | { ok: false; message: string };

export async function trocarSenhaInicialAction(
  _previous: TrocaSenhaResult | null,
  formData: FormData,
): Promise<TrocaSenhaResult> {
  try {
    await verifySession();
    const result = await executeTrocarSenhaInicial({
      current: formData.get("current"),
      next: formData.get("next"),
      confirm: formData.get("confirm"),
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    return { ok: true };
  } catch (error: unknown) {
    return failAction(error);
  }
}
