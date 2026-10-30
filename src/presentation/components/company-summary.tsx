import type { ResumoEmpresa } from "@/data/supabase/reads";
import { cn } from "@/presentation/cn";
import { formatCents } from "@/presentation/format";
import { Card } from "./ui/card";

const cards = [
  { key: "saldoCents", label: "Saldo em campo", hint: "Soma do saldo das subcontas", tone: "border-t-primary" },
  { key: "emAnaliseCents", label: "Em análise", hint: "Comprovantes ainda sem baixa", tone: "border-t-status-pending" },
  { key: "baixadoCents", label: "Baixado", hint: "Total aceito nas subcontas", tone: "border-t-secondary" },
] as const;

export function CompanySummary({ resumo }: { resumo: ResumoEmpresa }) {
  return (
    <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.key} className={cn("border-t-4 p-4", card.tone)}>
          <dt className="text-sm text-foreground">{card.label}</dt>
          <dd className="mt-1 text-2xl text-foreground">{formatCents(resumo[card.key])}</dd>
          <p className="mt-1 text-sm text-muted-foreground">{card.hint}</p>
        </Card>
      ))}
    </dl>
  );
}
