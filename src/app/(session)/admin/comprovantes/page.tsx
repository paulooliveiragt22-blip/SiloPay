import { readComprovantes, readFila } from "@/data/supabase/reads";
import { ReceiptHistory } from "@/presentation/components/receipt-history";
import { ReceiptQueue } from "@/presentation/components/receipt-queue";
import { toQueueRows } from "@/presentation/queue-rows";
import { PageStack } from "@/presentation/components/saldo";

export const dynamic = "force-dynamic";

export default async function FilaPage() {
  const [fila, historico] = await Promise.all([readFila(), readComprovantes()]);

  return (
    <PageStack title="Comprovantes">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Para analisar</h2>
        <ReceiptQueue rows={toQueueRows(fila)} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Histórico</h2>
        <ReceiptHistory rows={historico} />
      </section>
    </PageStack>
  );
}
