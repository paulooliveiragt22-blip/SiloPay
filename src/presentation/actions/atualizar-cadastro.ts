"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { executeAtualizarCadastro } from "@/data/index";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function atualizarCadastroAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();

    const hiredOn = formData.get("hiredOn");
    const result = await executeAtualizarCadastro({
      employeeId: formData.get("employeeId"),
      jobTitle: formData.get("jobTitle"),
      phone: formData.get("phone"),
      postalCode: formData.get("postalCode"),
      street: formData.get("street"),
      streetNumber: formData.get("streetNumber"),
      complement: formData.get("complement"),
      district: formData.get("district"),
      city: formData.get("city"),
      state: formData.get("state"),
      hiredOn: typeof hiredOn === "string" && hiredOn.trim().length === 0 ? null : hiredOn,
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidatePath("/admin");
    revalidatePath("/admin/colaboradores");
    return { ok: true, message: "Cadastro atualizado." };
  } catch (error: unknown) {
    return failAction(error);
  }
}
