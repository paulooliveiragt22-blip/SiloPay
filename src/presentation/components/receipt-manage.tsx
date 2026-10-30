"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtratoItem } from "@/data/supabase/reads";
import { corrigirComprovanteAction, excluirComprovanteAction } from "@/presentation/actions/comprovante-pendente";
import { categoryOptions } from "@/presentation/categories";
import { centsToReaisInput } from "@/presentation/format";
import { uploadReceiptPhoto } from "@/presentation/receipt-upload";
import { ReceiptPhotoPicker } from "./receipt-photo-picker";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldGroup } from "./ui/field";
import { MoneyInput } from "./money-input";
import { Input, NativeSelect } from "./ui/input";
import { Label } from "./ui/label";

export function ReceiptManage({
  item,
  companyId,
  employeeId,
}: {
  item: ExtratoItem;
  companyId: string;
  employeeId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [keepPhoto, setKeepPhoto] = useState(true);
  const [pickerKey, setPickerKey] = useState(0);
  const [amount, setAmount] = useState(centsToReaisInput(item.amountCents));
  const [category, setCategory] = useState(item.category ?? "outros");
  const [note, setNote] = useState(item.placeNote ?? "");

  async function save() {
    setPending(true);
    setMessage(null);
    if (!file && !keepPhoto) {
      setPending(false);
      setMessage("Escolha uma foto JPG, PNG ou WebP.");
      return;
    }
    let storagePath: string | null = null;
    if (file) {
      const uploaded = await uploadReceiptPhoto(file, { companyId, employeeId });
      if (!uploaded.ok) {
        setPending(false);
        setMessage(uploaded.message);
        return;
      }
      storagePath = uploaded.path;
    }
    const result = await corrigirComprovanteAction({
      receiptId: item.id,
      amountReais: amount,
      category,
      placeNote: note,
      storagePath,
    });
    setPending(false);
    setMessage(result.ok ? null : result.message);
    if (result.ok) {
      setEditing(false);
      setFile(null);
      setKeepPhoto(true);
      setPickerKey((key) => key + 1);
      router.refresh();
    }
  }

  async function remove() {
    setPending(true);
    setMessage(null);
    const result = await excluirComprovanteAction(item.id);
    setPending(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setMessage(null);
            setAmount(centsToReaisInput(item.amountCents));
            setCategory(item.category ?? "outros");
            setNote(item.placeNote ?? "");
            setFile(null);
            setKeepPhoto(true);
            setPickerKey((key) => key + 1);
            setEditing(true);
          }}
        >
          Editar
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={() => { setMessage(null); setConfirming(true); }}>
          Excluir
        </Button>
      </div>

      <Dialog
        open={editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(false);
            setFile(null);
            setKeepPhoto(true);
            setPickerKey((key) => key + 1);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar comprovante</DialogTitle>
            <DialogDescription>Excluir a foto pede outra antes de salvar. Sem troca, a foto atual continua.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <p className="text-sm font-medium text-foreground">Foto</p>
              <ReceiptPhotoPicker
                key={pickerKey}
                currentSrc={keepPhoto ? item.photoUrl : null}
                onFile={setFile}
                onRemoveCurrent={() => setKeepPhoto(false)}
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-amount-${item.id}`}>Valor</Label>
              <MoneyInput
                id={`edit-amount-${item.id}`}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor={`edit-category-${item.id}`}>Categoria</Label>
              <NativeSelect
                id={`edit-category-${item.id}`}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <Label htmlFor={`edit-note-${item.id}`}>Observação</Label>
              <Input
                id={`edit-note-${item.id}`}
                maxLength={200}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
            <Button type="button" disabled={pending} onClick={() => void save()}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
            {message ? (
              <p className="text-sm text-destructive" role="alert">
                {message}
              </p>
            ) : null}
          </FieldGroup>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) setConfirming(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir comprovante</DialogTitle>
            <DialogDescription>Ele sai da fila. Nenhum valor entra no saldo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={() => void remove()}>
              {pending ? "Excluindo…" : "Excluir"}
            </Button>
          </div>
          {message ? (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
