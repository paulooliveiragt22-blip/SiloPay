import Link from "next/link";
import { readExtratoFuncionario, readSaldoEmpresa, readSubcontas } from "@/data/supabase/reads";
import { BalanceNotice } from "@/presentation/components/balance-notice";
import { EmployeeDialogs } from "@/presentation/components/employee-dialogs";
import { ExpenseStatus, expenseRowClass } from "@/presentation/components/expense-status";
import { PageStack } from "@/presentation/components/saldo";
import { formatCents } from "@/presentation/format";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { ChipLink } from "@/presentation/components/ui/chip";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export default async function ColaboradoresPage({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string | string[]; id?: string | string[] }>;
}) {
  const query = await searchParams;
  const [rows, saldoEmpresa] = await Promise.all([readSubcontas(), readSaldoEmpresa()]);
  const creating = first(query.cadastro) === "novo";
  const viewingId = creating ? null : first(query.id);
  const extrato = viewingId ? await readExtratoFuncionario(viewingId) : [];

  return (
    <PageStack title="Colaboradores" action={<ChipLink href="/admin/colaboradores?cadastro=novo">Novo colaborador</ChipLink>}>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Nenhum funcionário nesta empresa.</CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const pending = row.saldoCents !== 0 || row.emAnaliseCents > 0;
            return (
              <li key={row.employeeId}>
                <Card className={expenseRowClass(pending ? "pending" : "neutral", "shadow-sm")}>
                  <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <CardTitle className="truncate">{row.employeeName ?? "Colaborador"}</CardTitle>
                      {row.cadastro?.jobTitle ? (
                        <p className="truncate text-sm text-muted-foreground">{row.cadastro.jobTitle}</p>
                      ) : null}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/colaboradores?id=${row.employeeId}`}>Ver</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {row.emAnaliseCents > 0 ? <ExpenseStatus tone="pending">Pendente de aprovação</ExpenseStatus> : null}
                      <span className="text-sm text-muted-foreground">
                        {!row.linked ? "Sem conta" : row.provisional ? "Senha temporária" : "Conta vinculada"}
                      </span>
                      <span className="text-sm text-foreground">Saldo {formatCents(row.saldoCents)}</span>
                    </div>
                    <BalanceNotice
                      employeeId={row.employeeId}
                      saldoCents={row.saldoCents}
                      companySaldoCents={saldoEmpresa.saldoCents}
                    />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <EmployeeDialogs
        rows={rows}
        creating={creating}
        viewingId={viewingId}
        extrato={extrato}
        companySaldoCents={saldoEmpresa.saldoCents}
      />
    </PageStack>
  );
}
