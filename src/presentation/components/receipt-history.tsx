"use client";

import { useState } from "react";
import type { ComprovanteItem } from "@/data/supabase/reads";
import { categoryLabel } from "@/presentation/categories";
import { formatCents } from "@/presentation/format";
import { ExpenseStatus, labelOfExtrato, toneOfReceipt } from "./expense-status";
import { ReceiptPhoto } from "./receipt-photo";
import { ReceiptZoomDialog } from "./receipt-zoom";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

function when(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function ReceiptHistory({ rows }: { rows: ComprovanteItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const current = rows.find((row) => row.receiptId === openId) ?? null;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Nenhum comprovante baixado ainda.</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Table>
        <caption className="sr-only">Histórico de comprovantes</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Colaborador</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Informado</TableHead>
            <TableHead>Aceito</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Comprovante</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.receiptId}>
              <TableCell className="max-w-40 truncate font-medium text-foreground">{row.employeeName}</TableCell>
              <TableCell className="text-foreground">{categoryLabel(row.category)}</TableCell>
              <TableCell className="text-foreground">{formatCents(row.amountClaimedCents)}</TableCell>
              <TableCell className="text-foreground">
                {row.amountApprovedCents === null ? "—" : formatCents(row.amountApprovedCents)}
              </TableCell>
              <TableCell>
                <ExpenseStatus tone={toneOfReceipt(row.status)}>
                  {labelOfExtrato({ kind: "comprovante", receiptStatus: row.status })}
                </ExpenseStatus>
              </TableCell>
              <TableCell>
                <Button type="button" variant="outline" size="sm" onClick={() => { setZoom(false); setOpenId(row.receiptId); }}>
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={current !== null}
        onOpenChange={(open) => {
          if (!open && !zoom) setOpenId(null);
        }}
      >
        <DialogContent
          className="max-w-xl"
          onPointerDownOutside={(event) => {
            if (zoom) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (zoom) event.preventDefault();
          }}
          onFocusOutside={(event) => {
            if (zoom) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (zoom) event.preventDefault();
          }}
        >
          {current ? (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">Comprovante de {current.employeeName}</DialogTitle>
                <DialogDescription>
                  {categoryLabel(current.category)}
                  {current.placeNote ? ` · ${current.placeNote}` : ""}
                  {current.reviewedAt ? ` · Baixa em ${when(current.reviewedAt)}` : ""}
                </DialogDescription>
              </DialogHeader>
              <ExpenseStatus tone={toneOfReceipt(current.status)}>
                {labelOfExtrato({ kind: "comprovante", receiptStatus: current.status })}
              </ExpenseStatus>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Informado</dt>
                  <dd className="text-foreground">{formatCents(current.amountClaimedCents)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Aceito</dt>
                  <dd className="text-foreground">
                    {current.amountApprovedCents === null ? "—" : formatCents(current.amountApprovedCents)}
                  </dd>
                </div>
              </dl>
              {current.photoUrl ? (
                <>
                  <button
                    type="button"
                    className="overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Ampliar comprovante de ${current.employeeName}`}
                    onClick={() => setZoom(true)}
                  >
                    <img src={current.photoUrl} alt="" className="aspect-[4/3] w-full object-contain" />
                  </button>
                  <p className="text-sm text-muted-foreground">Clique na foto para ampliar e ler valor e data.</p>
                </>
              ) : (
                <ReceiptPhoto src={null} alt={`Comprovante de ${current.employeeName}`} />
              )}
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Comprovante</DialogTitle>
              <DialogDescription>Este comprovante não está mais na lista.</DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
      <ReceiptZoomDialog
        src={current?.photoUrl ?? null}
        alt={current ? `Comprovante de ${current.employeeName}` : "Comprovante"}
        open={zoom && current?.photoUrl != null}
        onOpenChange={(open) => {
          if (!open) setZoom(false);
        }}
      />
    </>
  );
}
