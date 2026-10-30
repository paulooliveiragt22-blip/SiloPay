"use client";

import { useState } from "react";
import { ExpenseStatus } from "@/presentation/components/expense-status";
import type { QueueRow } from "@/presentation/queue-rows";
import { ReceiptPhoto } from "./receipt-photo";
import { ReceiptZoomDialog } from "./receipt-zoom";
import { ReviewForm } from "./review-form";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function ReceiptQueue({ rows }: { rows: QueueRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const current = rows.find((row) => row.receiptId === openId) ?? null;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Nenhum comprovante na fila.</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Table>
        <caption className="sr-only">Comprovantes em análise</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Colaborador</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Observação</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Comprovante</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.receiptId}>
              <TableCell>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-medium text-foreground">{row.employeeName}</span>
                  <ExpenseStatus tone="pending">Pendente de aprovação</ExpenseStatus>
                </div>
              </TableCell>
              <TableCell className="text-foreground">{row.categoryLabel}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">{row.placeNote ?? "—"}</TableCell>
              <TableCell className="text-foreground">{row.amountLabel}</TableCell>
              <TableCell>
                <Button type="button" variant="outline" size="sm" onClick={() => { setZoom(false); setOpenId(row.receiptId); }}>
                  Ver e baixar
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
                  {current.categoryLabel} · {current.amountLabel}
                  {current.placeNote ? ` · ${current.placeNote}` : ""}
                </DialogDescription>
              </DialogHeader>
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
              <ReviewForm receiptId={current.receiptId} claimedCents={current.claimedCents} />
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>Comprovante</DialogTitle>
              <DialogDescription>Nenhum comprovante selecionado.</DialogDescription>
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
