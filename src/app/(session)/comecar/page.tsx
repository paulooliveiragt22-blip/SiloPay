import { redirect } from "next/navigation";
import { CreateCompanyForm } from "@/presentation/components/create-company-form";
import { PageStack } from "@/presentation/components/saldo";
import { verifySession } from "@/presentation/session";

export default async function ComecarPage() {
  const session = await verifySession();
  if (session.membership?.role === "admin") redirect("/admin");
  if (session.membership?.role === "funcionario") redirect("/campo");

  return (
    <PageStack title="Criar empresa">
      <p className="text-sm text-muted-foreground">O primeiro usuário desta empresa entra como admin.</p>
      <CreateCompanyForm />
    </PageStack>
  );
}
