import "server-only";
import { redirect } from "next/navigation";
import { expireProvisionalAccess } from "@/data/auth/employee-access";
import { readMeuAcesso } from "@/data/supabase/reads";

export async function redirectIfProvisionalPassword() {
  const acesso = await readMeuAcesso();
  if (!acesso?.mustChangePassword) return;
  if (Date.parse(acesso.expiresAt) <= Date.now()) {
    const ended = await expireProvisionalAccess().catch(() => false);
    if (ended) redirect("/login?motivo=senha-vencida");
    redirect("/acesso/senha?vencida=1");
  }
  redirect("/acesso/senha");
}
