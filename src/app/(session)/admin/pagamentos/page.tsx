import { readSaldoEmpresa } from "@/data/supabase/reads";
import { AccountDialog } from "@/presentation/components/account-dialog";
import { AddBalanceForm } from "@/presentation/components/add-balance-form";
import { PageStack } from "@/presentation/components/saldo";
import { formatCents } from "@/presentation/format";
import { Card } from "@/presentation/components/ui/card";
import { ChipLink } from "@/presentation/components/ui/chip";
import { DialogDescription, DialogHeader, DialogTitle } from "@/presentation/components/ui/dialog";
import { cn } from "@/presentation/cn";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

const cards = [
  { key: "saldoCents", label: "Saldo da empresa", tone: "border-t-primary" },
  { key: "entradasCents", label: "Entradas", tone: "border-t-status-approved" },
  { key: "enviadosCents", label: "Enviado aos colaboradores", tone: "border-t-secondary" },
  { key: "devolucoesCents", label: "Devoluções", tone: "border-t-status-approved" },
] as const;

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ adicionar?: string | string[] }>;
}) {
  const query = await searchParams;
  const saldo = await readSaldoEmpresa();
  const adding = first(query.adicionar) === "1";

  return (
    <PageStack
      title="Saldo da empresa"
      action={<ChipLink href="/admin/pagamentos?adicionar=1">Adicionar saldo</ChipLink>}
    >
      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key} className={cn("border-t-4 p-4", card.tone)}>
            <dt className="text-sm text-foreground">{card.label}</dt>
            <dd className="mt-1 text-2xl text-foreground">{formatCents(saldo[card.key])}</dd>
          </Card>
        ))}
      </dl>
      <p className="text-sm text-muted-foreground">
        O valor enviado ao colaborador sai deste saldo. A devolução da sobra volta para cá. A baixa do comprovante não devolve dinheiro.
      </p>
      <AccountDialog open={adding}>
        <DialogHeader>
          <DialogTitle>Adicionar saldo</DialogTitle>
          <DialogDescription>Entrada manual na conta da empresa. Não envia valor ao colaborador.</DialogDescription>
        </DialogHeader>
        <AddBalanceForm />
      </AccountDialog>
    </PageStack>
  );
}
