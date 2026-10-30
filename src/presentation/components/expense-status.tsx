import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/presentation/cn";

export type ExpenseTone = "pending" | "approved" | "rejected" | "neutral";

const expenseStatus = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        pending: "bg-status-pending text-brand",
        approved: "bg-status-approved text-brand",
        rejected: "bg-status-rejected text-white",
        neutral: "bg-muted text-muted-foreground",
      },
    },
  },
);

const expenseRow = cva("rounded-lg border border-border bg-card border-l-4", {
  variants: {
    tone: {
      pending: "border-l-status-pending",
      approved: "border-l-status-approved",
      rejected: "border-l-status-rejected",
      neutral: "border-l-border",
    },
  },
});

export function ExpenseStatus({
  tone,
  children,
  className,
}: {
  tone: ExpenseTone;
  children: string;
  className?: string;
}) {
  return <span className={cn(expenseStatus({ tone }), className)}>{children}</span>;
}

export function expenseRowClass(tone: ExpenseTone, className?: string) {
  return cn(expenseRow({ tone }), className);
}

export function toneOfReceipt(status: string | null): ExpenseTone {
  if (status === "em_analise") return "pending";
  if (status === "recusado") return "rejected";
  if (status === "aprovado" || status === "parcial") return "approved";
  return "neutral";
}

export function toneOfExtrato(item: {
  kind: string;
  efeito: string;
  receiptStatus: string | null;
}): ExpenseTone {
  if (item.kind === "comprovante") return toneOfReceipt(item.receiptStatus);
  if (item.efeito === "credito") return "approved";
  return "neutral";
}

export function labelOfExtrato(item: {
  kind: string;
  receiptStatus: string | null;
}): string {
  if (item.kind === "comprovante") {
    if (item.receiptStatus === "em_analise") return "Pendente de aprovação";
    if (item.receiptStatus === "aprovado") return "Aprovado";
    if (item.receiptStatus === "parcial") return "Aprovado em parte";
    if (item.receiptStatus === "recusado") return "Recusado";
    return "Comprovante";
  }
  if (item.kind === "adiantamento" || item.kind === "reembolso") return "Pix enviado";
  if (item.kind === "baixa") return "Baixa";
  if (item.kind === "devolucao") return "Devolução";
  return item.kind;
}

export type ExpenseStatusVariants = VariantProps<typeof expenseStatus>;
