"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ExtratoItem, SaldoView } from "@/data/supabase/reads";
import { ExpenseStatus } from "./expense-status";
import { EmployeeForm } from "./employee-form";
import { ExtratoList } from "./extrato-list";
import { SaldoGrid } from "./saldo";
import { formatCents } from "@/presentation/format";
import { TransferForm } from "./transfer-form";
import { ReturnForm } from "./return-form";
import { EmployeeAccessForm } from "./employee-access-form";
import { BalanceNotice } from "./balance-notice";
import { ReceiptZoomFrame } from "./receipt-zoom";
import { EmployeeProfile } from "./employee-profile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function EmployeeDialogs({
  rows,
  creating,
  viewingId,
  extrato,
  companySaldoCents,
}: {
  rows: SaldoView[];
  creating: boolean;
  viewingId: string | null;
  extrato: ExtratoItem[];
  companySaldoCents: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const row = rows.find((item) => item.employeeId === viewingId) ?? null;
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);

  function close() {
    setPhoto(null);
    router.replace(pathname, { scroll: false });
  }

  return (
    <>
      <Dialog
        open={creating}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo colaborador</DialogTitle>
            <DialogDescription>
              O cadastro pede cargo, telefone, endereço e o e-mail do colaborador. A senha temporária aparece uma vez e ele troca no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm />
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewingId !== null}
        onOpenChange={(open) => {
          if (!open && !photo) close();
        }}
      >
        <DialogContent
          className="max-w-2xl"
          onPointerDownOutside={(event) => {
            if (photo) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (photo) event.preventDefault();
          }}
          onFocusOutside={(event) => {
            if (photo) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (photo) event.preventDefault();
          }}
        >
          {row ? (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">{row.employeeName ?? "Colaborador"}</DialogTitle>
                <DialogDescription>{row.status ?? "Subconta"}</DialogDescription>
              </DialogHeader>
              <EmployeeProfile cadastro={row.cadastro} />
              {row.emAnaliseCents > 0 ? <ExpenseStatus tone="pending">Pendente de aprovação</ExpenseStatus> : null}
              <SaldoGrid saldo={row} />
              <section className="flex flex-col gap-2">
                <ExtratoList
                  items={extrato}
                  onOpenPhoto={(src, alt) => setPhoto({ src, alt })}
                />
              </section>
              <p className="text-sm text-foreground">Saldo da empresa: {formatCents(companySaldoCents)}</p>
              <BalanceNotice employeeId={row.employeeId} saldoCents={row.saldoCents} companySaldoCents={companySaldoCents} />
              {row.linked ? (
                <p className="text-sm text-foreground">
                  {row.provisional ? "A senha temporária ainda não foi trocada." : "Conta ativa."}
                </p>
              ) : (
                <p className="text-sm text-foreground">Este colaborador ainda não tem login.</p>
              )}
              <EmployeeAccessForm employeeId={row.employeeId} linked={row.linked} />
              <TransferForm employeeId={row.employeeId} />
              {row.saldoCents > 0 ? <ReturnForm employeeId={row.employeeId} /> : null}
              <Link href="/admin/pagamentos?adicionar=1" className="text-sm font-medium text-foreground underline">
                Adicionar saldo
              </Link>
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Colaborador</DialogTitle>
              <DialogDescription>Este cadastro não está na empresa.</DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={photo !== null}
        onOpenChange={(open) => {
          if (!open) setPhoto(null);
        }}
      >
        <DialogContent className="max-h-[92dvh] max-w-5xl">
          {photo ? (
            <>
              <DialogHeader>
                <DialogTitle>Foto do comprovante</DialogTitle>
                <DialogDescription>{photo.alt}</DialogDescription>
              </DialogHeader>
              <ReceiptZoomFrame src={photo.src} alt={photo.alt} />
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Foto do comprovante</DialogTitle>
              <DialogDescription>A foto não está mais disponível.</DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
