"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { executeCadastrarComAcesso } from "@/data/auth/employee-access";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";

export type CadastroResult =
  | { ok: true; message: string; employeeId: string; provisionalPassword: string }
  | { ok: false; message: string };

export async function cadastrarFuncionarioAction(
  _previous: CadastroResult | null,
  formData: FormData,
): Promise<CadastroResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();

    const result = await executeCadastrarComAcesso({
      name: formData.get("name"),
      cpf: formData.get("cpf"),
      pixKeyType: formData.get("pixKeyType"),
      pixKey: formData.get("pixKey"),
      email: formData.get("email"),
      jobTitle: formData.get("jobTitle"),
      phone: formData.get("phone"),
      postalCode: formData.get("postalCode"),
      street: formData.get("street"),
      streetNumber: formData.get("streetNumber"),
      complement: formData.get("complement"),
      district: formData.get("district"),
      city: formData.get("city"),
      state: formData.get("state"),
      hiredOn: formData.get("hiredOn"),
    });
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    revalidatePath("/admin");
    revalidatePath("/admin/colaboradores");
    return {
      ok: true,
      message: "Colaborador cadastrado.",
      employeeId: result.value.employeeId,
      provisionalPassword: result.value.provisionalPassword,
    };
  } catch (error: unknown) {
    return failAction(error);
  }
}
