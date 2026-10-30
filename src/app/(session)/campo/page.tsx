import { readExtrato, readMinhaSubconta } from "@/data/supabase/reads";
import {
  ExpenseStatus,
  expenseRowClass,
  labelOfExtrato,
  toneOfExtrato,
} from "@/presentation/components/expense-status";
import { formatCents } from "@/presentation/format";
import { PageStack, SaldoGrid } from "@/presentation/components/saldo";

export const dynamic = "force-dynamic";

export default async function CampoPage() {
  const [saldo, extrato] = await Promise.all([readMinhaSubconta(), readExtrato()]);

  return (
    <PageStack title="Minha subconta">
      <a href="/campo/comprovantes/novo" className="text-sm text-accent">
        Enviar comprovante
      </a>
      {saldo ? (
        <SaldoGrid saldo={saldo} />
      ) : (
        <p className="text-sm text-muted-foreground">Ainda não há lançamento nesta subconta.</p>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg">Extrato</h2>
        {extrato.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum comprovante ou Pix nesta subconta.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {extrato.map((item) => {
              const tone = toneOfExtrato(item);
              return (
                <li key={item.id} className={expenseRowClass(tone, "flex items-center justify-between gap-3 px-4 py-3")}>
                  <div className="flex min-w-0 flex-col gap-1">
                    <ExpenseStatus tone={tone}>{labelOfExtrato(item)}</ExpenseStatus>
                    <p className="truncate text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                        new Date(item.occurredAt),
                      )}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm">{formatCents(item.amountCents)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageStack>
  );
}
