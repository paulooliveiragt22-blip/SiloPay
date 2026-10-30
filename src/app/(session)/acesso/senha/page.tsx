import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/presentation/components/change-password-form";
import { expireProvisionalAccess } from "@/data/auth/employee-access";
import { readMeuAcesso } from "@/data/supabase/reads";
import { verifySession } from "@/presentation/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ vencida?: string | string[] }>;
}) {
  await verifySession();
  const query = await searchParams;
  const flagged = query.vencida === "1";
  const acesso = await readMeuAcesso();
  if (!acesso?.mustChangePassword && !flagged) redirect("/");

  const expired = flagged || (acesso !== null && Date.parse(acesso.expiresAt) <= Date.now());
  if (expired && acesso?.mustChangePassword) {
    const ended = await expireProvisionalAccess().catch(() => false);
    if (ended) redirect("/login?motivo=senha-vencida");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
          <CardDescription>
            {expired
              ? "A senha temporária venceu. Peça outra à empresa."
              : "A senha temporária só serve neste primeiro acesso."}
          </CardDescription>
        </CardHeader>
        <CardContent>{expired ? null : <ChangePasswordForm />}</CardContent>
      </Card>
    </main>
  );
}
