import type { ReactNode } from "react";
import type { SaldoView } from "@/data/supabase/reads";
import { cn } from "@/presentation/cn";
import { formatCents } from "@/presentation/format";
import { Card } from "./ui/card";

export function SaldoGrid({ saldo }: { saldo: SaldoView }) {
  const items = [
    ["Transferido", saldo.transferidoCents, "border-t-status-approved"],
    ["Em análise", saldo.emAnaliseCents, "border-t-status-pending"],
    ["Baixado", saldo.baixadoCents, "border-t-secondary"],
    ["Saldo", saldo.saldoCents, "border-t-primary"],
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([label, cents, tone]) => (
        <Card key={label} className={cn("border-t-4 p-3 shadow-none", tone)}>
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-lg">{formatCents(cents)}</dd>
        </Card>
      ))}
    </dl>
  );
}

export function PageStack({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {action}
      </div>
      {children}
    </main>
  );
}
