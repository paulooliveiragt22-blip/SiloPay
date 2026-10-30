import { redirect } from "next/navigation";
import { CreateCompanyForm } from "@/presentation/components/create-company-form";
import { verifySession } from "@/presentation/session";
import { redirectIfProvisionalPassword } from "@/presentation/access-gate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";

export default async function ComecarPage() {
  const session = await verifySession();
  await redirectIfProvisionalPassword();
  if (session.membership?.role === "admin") redirect("/admin");
  if (session.membership?.role === "funcionario") redirect("/campo");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-col px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Criar empresa</CardTitle>
          <CardDescription>O primeiro usuário desta empresa entra como admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCompanyForm />
        </CardContent>
      </Card>
    </main>
  );
}
