"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { executeCriarEmpresa } from "@/data/index";
import { messageFor, messageFromUnknown } from "../messages";
import { verifySession } from "../session";
import type { ActionResult } from "./review-receipt";

export async function criarEmpresaAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await verifySession();
  if (session.membership) forbidden();

  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "");
  if (name.length === 0) return { ok: false, message: "Informe o nome da empresa." };

  try {
    const result = await executeCriarEmpresa({ name, cnpj });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
  } catch (error: unknown) {
    return { ok: false, message: messageFromUnknown(error) };
  }

  revalidatePath("/");
  return { ok: true, message: "Empresa criada." };
}
