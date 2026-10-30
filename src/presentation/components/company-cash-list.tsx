"use client";

import type { MovimentoEmpresa } from "@/data/supabase/reads";
import { formatCents } from "@/presentation/format";
import { ExpenseStatus, expenseRowClass } from "./expense-status";

export function CompanyCashList({ items }: { items: MovimentoEmpresa[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma entrada nesta conta.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const tone = item.kind === "envio" ? "neutral" : "approved";
        const label =
          item.kind === "entrada"
            ? "Entrada"
            : item.kind === "devolucao"
              ? "Devolução"
              : item.sendKind === "adiantamento"
                ? "Adiantamento"
                : item.sendKind === "reembolso"
                  ? "Reembolso"
                  : "Enviado";
        return (
          <li key={item.id} className={expenseRowClass(tone, "flex items-center justify-between gap-3 px-4 py-3")}>
            <div className="flex min-w-0 flex-col gap-1">
              <ExpenseStatus tone={tone}>{label}</ExpenseStatus>
              <p className="truncate text-sm text-muted-foreground">
                {item.employeeName ? `${item.employeeName} · ` : ""}
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                  new Date(item.occurredAt),
                )}
              </p>
            </div>
            <p className="shrink-0 text-sm text-foreground">
              {item.kind === "envio" ? "− " : "+ "}
              {formatCents(item.amountCents)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
