"use client";

import type { ReactNode } from "react";
import type { ExtratoItem } from "@/data/supabase/reads";
import { categoryLabel } from "@/presentation/categories";
import { formatCents } from "@/presentation/format";
import { ExpenseStatus, expenseRowClass, labelOfExtrato, toneOfExtrato } from "./expense-status";
import { ReceiptManage } from "./receipt-manage";
import { ReceiptPhoto } from "./receipt-photo";

function when(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function ExtratoList({
  items,
  onOpenPhoto,
  draft,
}: {
  items: ExtratoItem[];
  onOpenPhoto?: (src: string, alt: string) => void;
  draft?: { companyId: string; employeeId: string };
}) {
  const visible = items.filter((item) => item.kind !== "baixa");
  const sends = visible.filter((item) => item.kind === "adiantamento" || item.kind === "reembolso");
  const receipts = visible.filter((item) => item.kind === "comprovante");
  const returns = visible.filter((item) => item.kind === "devolucao");

  if (sends.length === 0 && receipts.length === 0 && returns.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum movimento nesta subconta.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <MovementGroup title="Envio da empresa" items={sends} render={(item) => <SendRow item={item} />} />
      <MovementGroup
        title="Comprovantes"
        items={receipts}
        render={(item) => <ReceiptRow item={item} onOpenPhoto={onOpenPhoto} draft={draft} />}
      />
      <MovementGroup title="Devoluções" items={returns} render={(item) => <ReturnRow item={item} />} />
    </div>
  );
}

function MovementGroup({
  title,
  items,
  render,
}: {
  title: string;
  items: ExtratoItem[];
  render: (item: ExtratoItem) => ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>{render(item)}</li>
        ))}
      </ul>
    </section>
  );
}

function SendRow({ item }: { item: ExtratoItem }) {
  const tone = toneOfExtrato(item);
  return (
    <article className={expenseRowClass(tone, "flex items-center justify-between gap-3 px-4 py-3")}>
      <div className="flex min-w-0 flex-col gap-1">
        <ExpenseStatus tone={tone}>{labelOfExtrato(item)}</ExpenseStatus>
        <p className="truncate text-sm text-muted-foreground">Envio da empresa · {when(item.occurredAt)}</p>
      </div>
      <p className="shrink-0 text-sm text-foreground">+ {formatCents(item.amountCents)}</p>
    </article>
  );
}

function ReceiptRow({
  item,
  onOpenPhoto,
  draft,
}: {
  item: ExtratoItem;
  onOpenPhoto?: (src: string, alt: string) => void;
  draft?: { companyId: string; employeeId: string };
}) {
  const tone = toneOfExtrato(item);
  const caption = `${item.category ? categoryLabel(item.category) : "Comprovante"} · ${when(item.occurredAt)}`;
  return (
    <article className={expenseRowClass(tone, "flex items-center gap-3 px-4 py-3")}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <ExpenseStatus tone={tone}>{labelOfExtrato(item)}</ExpenseStatus>
          <p className="truncate text-sm text-muted-foreground">{caption}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Informado</dt>
            <dd className="text-foreground">{formatCents(item.amountCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Aceito</dt>
            <dd className="text-foreground">{item.approvedCents === null ? "—" : formatCents(item.approvedCents)}</dd>
          </div>
        </dl>
        {onOpenPhoto ? null : <ReceiptPhoto src={item.photoUrl} alt={caption} />}
        {draft && item.receiptStatus === "em_analise" ? (
          <ReceiptManage item={item} companyId={draft.companyId} employeeId={draft.employeeId} />
        ) : null}
      </div>
      {onOpenPhoto ? (
        <ReceiptThumb
          src={item.photoUrl}
          alt={caption}
          onOpen={() => item.photoUrl && onOpenPhoto(item.photoUrl, caption)}
        />
      ) : null}
    </article>
  );
}

function ReceiptThumb({ src, alt, onOpen }: { src: string | null; alt: string; onOpen: () => void }) {
  if (!src) {
    return (
      <span
        role="img"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        aria-label="Foto indisponível"
      >
        <ReceiptMark />
      </span>
    );
  }

  return (
    <button
      type="button"
      className="size-10 shrink-0 overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Abrir foto: ${alt}`}
      onClick={onOpen}
    >
      <img src={src} alt="" className="size-full object-cover" />
    </button>
  );
}

function ReceiptMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <rect x="3" y="2" width="10" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 6.5h5M5.5 9h5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReturnRow({ item }: { item: ExtratoItem }) {
  return (
    <article className={expenseRowClass("neutral", "flex items-center justify-between gap-3 px-4 py-3")}>
      <div className="flex min-w-0 flex-col gap-1">
        <ExpenseStatus tone="neutral">{labelOfExtrato(item)}</ExpenseStatus>
        <p className="truncate text-sm text-muted-foreground">{when(item.occurredAt)}</p>
      </div>
      <p className="shrink-0 text-sm text-foreground">− {formatCents(item.amountCents)}</p>
    </article>
  );
}
