import { readEventos, readFila, readResumoEmpresa, readSaldoEmpresa } from "@/data/supabase/reads";
import { ActivityList } from "@/presentation/components/activity-list";
import { CompanySummary } from "@/presentation/components/company-summary";
import { ReceiptQueue } from "@/presentation/components/receipt-queue";
import { toQueueRows } from "@/presentation/queue-rows";
import { PageStack } from "@/presentation/components/saldo";
import { formatCents } from "@/presentation/format";
import { Card } from "@/presentation/components/ui/card";
import { ChipLink } from "@/presentation/components/ui/chip";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [resumo, fila, saldoEmpresa, events] = await Promise.all([
    readResumoEmpresa(),
    readFila(),
    readSaldoEmpresa(),
    readEventos(),
  ]);

  return (
    <PageStack title="Início">
      <Card className="flex flex-wrap items-center justify-between gap-3 border-t-4 border-t-primary p-4">
        <div>
          <p className="text-sm text-foreground">Saldo da empresa</p>
          <p className="mt-1 text-xl text-foreground tabular-nums sm:text-2xl">{formatCents(saldoEmpresa.saldoCents)}</p>
          <p className="mt-1 text-sm text-muted-foreground">O valor enviado ao colaborador sai daqui.</p>
        </div>
        <ChipLink href="/admin/pagamentos?adicionar=1">Adicionar saldo</ChipLink>
      </Card>
      <CompanySummary resumo={resumo} />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg text-foreground">Comprovantes em análise</h2>
        <ReceiptQueue rows={toQueueRows(fila)} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg text-foreground">Quem fez</h2>
        <ActivityList events={events} />
      </section>
    </PageStack>
  );
}
