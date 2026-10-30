import { readSubcontas } from "@/data/supabase/reads";
import { ExpenseStatus } from "@/presentation/components/expense-status";
import { TestAdvanceForm } from "@/presentation/components/test-advance-form";
import { PageStack, SaldoGrid } from "@/presentation/components/saldo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rows = await readSubcontas();

  return (
    <PageStack title="Funcionários">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum funcionário nesta empresa.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {rows.map((row) => (
            <li key={row.employeeId} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{row.employeeName}</p>
                {row.emAnaliseCents > 0 ? (
                  <ExpenseStatus tone="pending">Pendente de aprovação</ExpenseStatus>
                ) : null}
                <p className="text-sm text-muted-foreground">{row.status}</p>
              </div>
              <SaldoGrid saldo={row} />
              <TestAdvanceForm employeeId={row.employeeId} />
            </li>
          ))}
        </ul>
      )}
    </PageStack>
  );
}
