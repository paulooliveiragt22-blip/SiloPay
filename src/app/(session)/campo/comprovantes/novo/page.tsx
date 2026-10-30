import { forbidden } from "next/navigation";
import { ReceiptForm } from "@/presentation/components/receipt-form";
import { PageStack } from "@/presentation/components/saldo";
import { verifySession } from "@/presentation/session";

export const dynamic = "force-dynamic";

export default async function NovoComprovantePage() {
  const session = await verifySession();
  const membership = session.membership;
  if (membership?.role !== "funcionario" || !membership.employeeId) forbidden();

  return (
    <PageStack title="Novo comprovante">
      <ReceiptForm companyId={membership.companyId} employeeId={membership.employeeId} />
    </PageStack>
  );
}
