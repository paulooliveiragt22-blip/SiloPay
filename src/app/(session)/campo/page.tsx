import { forbidden } from "next/navigation";
import { readExtrato, readMinhaSubconta } from "@/data/supabase/reads";
import { ExtratoList } from "@/presentation/components/extrato-list";
import { ReceiptCreateDialog } from "@/presentation/components/receipt-create-dialog";
import { PageStack, SaldoGrid } from "@/presentation/components/saldo";
import { verifySession } from "@/presentation/session";
import { ChipLink } from "@/presentation/components/ui/chip";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function CampoPage({
  searchParams,
}: {
  searchParams: Promise<{ enviar?: string | string[] }>;
}) {
  const query = await searchParams;
  const session = await verifySession();
  const membership = session.membership;
  if (membership?.role !== "funcionario" || !membership.employeeId) forbidden();

  const [saldo, extrato] = await Promise.all([readMinhaSubconta(), readExtrato()]);

  return (
    <PageStack
      title="Minha subconta"
      action={<ChipLink href="/campo?enviar=1">Enviar comprovante</ChipLink>}
    >
      <ReceiptCreateDialog
        open={first(query.enviar) === "1"}
        companyId={membership.companyId}
        employeeId={membership.employeeId}
      />
      {saldo ? (
        <SaldoGrid saldo={saldo} />
      ) : (
        <p className="text-sm text-muted-foreground">Ainda não há lançamento nesta subconta.</p>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Extrato</h2>
        <ExtratoList
          items={extrato}
          draft={{ companyId: membership.companyId, employeeId: membership.employeeId }}
        />
      </section>
    </PageStack>
  );
}
