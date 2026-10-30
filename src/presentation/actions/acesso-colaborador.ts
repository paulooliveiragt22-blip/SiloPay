"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { executeAbrirAcesso, executeRenovarSenha } from "@/data/auth/employee-access";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";

export type SenhaProvisoriaResult =
  | { ok: true; provisionalPassword: string }
  | { ok: false; message: string };

export async function abrirAcessoAction(
  _previous: SenhaProvisoriaResult | null,
  formData: FormData,
): Promise<SenhaProvisoriaResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();
    const result = await executeAbrirAcesso({
      employeeId: formData.get("employeeId"),
      email: formData.get("email"),
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidatePath("/admin/colaboradores");
    return { ok: true, provisionalPassword: result.value.provisionalPassword };
  } catch (error: unknown) {
    return failAction(error);
  }
}

export async function renovarSenhaAction(
  _previous: SenhaProvisoriaResult | null,
  formData: FormData,
): Promise<SenhaProvisoriaResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();
    const result = await executeRenovarSenha(formData.get("employeeId"));
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidatePath("/admin/colaboradores");
    return { ok: true, provisionalPassword: result.value.provisionalPassword };
  } catch (error: unknown) {
    return failAction(error);
  }
}
