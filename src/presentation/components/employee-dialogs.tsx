"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { EventoEmpresaView, ExtratoItem, SaldoView } from "@/data/supabase/reads";
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
import { EmployeeProfileForm } from "./employee-profile-form";
import { ActivityList } from "./activity-list";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function EmployeeDialogs({
  rows,
  creating,
  viewingId,
  extrato,
  companySaldoCents,
  events,
}: {
  rows: SaldoView[];
  creating: boolean;
  viewingId: string | null;
  extrato: ExtratoItem[];
  companySaldoCents: number;
  events: EventoEmpresaView[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const row = rows.find((item) => item.employeeId === viewingId) ?? null;
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [viewingId]);

  function close() {
    setPhoto(null);
    setEditing(false);
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
              <Tabs key={row.employeeId} defaultValue="saldo" className="flex min-w-0 flex-col gap-4">
                <TabsList aria-label="Seções do colaborador">
                  <TabsTrigger value="saldo">Saldo</TabsTrigger>
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="acesso">Acesso</TabsTrigger>
                </TabsList>
                <TabsContent value="saldo">
                  {row.emAnaliseCents > 0 ? <ExpenseStatus tone="pending">Pendente de aprovação</ExpenseStatus> : null}
                  <SaldoGrid saldo={row} />
                  <ExtratoList items={extrato} onOpenPhoto={(src, alt) => setPhoto({ src, alt })} />
                  <p className="text-sm text-foreground">Saldo da empresa: {formatCents(companySaldoCents)}</p>
                  <BalanceNotice employeeId={row.employeeId} saldoCents={row.saldoCents} companySaldoCents={companySaldoCents} />
                  <TransferForm employeeId={row.employeeId} />
                  {row.saldoCents > 0 ? <ReturnForm employeeId={row.employeeId} /> : null}
                  <Link href="/admin/pagamentos?adicionar=1" className="text-sm font-medium text-foreground underline">
                    Adicionar saldo
                  </Link>
                </TabsContent>
                <TabsContent value="dados">
                  <EmployeeProfile cadastro={row.cadastro} />
                  <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                    Editar cadastro
                  </Button>
                </TabsContent>
                <TabsContent value="acesso">
                  {row.linked ? (
                    <p className="text-sm text-foreground">
                      {row.provisional ? "A senha temporária ainda não foi trocada." : "Conta ativa."}
                    </p>
                  ) : (
                    <p className="text-sm text-foreground">Este colaborador ainda não tem login.</p>
                  )}
                  <EmployeeAccessForm employeeId={row.employeeId} linked={row.linked} />
                  <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-medium text-foreground">Quem fez</h2>
                    <ActivityList events={events.filter((event) => event.employeeId === row.employeeId)} />
                  </section>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Colaborador</DialogTitle>
              <DialogDescription>Este cadastro não está na empresa.</DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editing && row !== null} onOpenChange={setEditing}>
        <DialogContent>
          {row ? (
            <>
              <DialogHeader>
                <DialogTitle>Editar cadastro</DialogTitle>
                <DialogDescription>Cargo, telefone, endereço e admissão. CPF, e-mail e Pix permanecem.</DialogDescription>
              </DialogHeader>
              <EmployeeProfileForm employeeId={row.employeeId} cadastro={row.cadastro} onSaved={() => setEditing(false)} />
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Editar cadastro</DialogTitle>
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
