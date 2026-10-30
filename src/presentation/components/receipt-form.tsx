"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitReceiptAction } from "@/presentation/actions/submit-receipt";
import { saveQueuedReceipt, type QueuedReceipt } from "@/presentation/receipt-outbox";
import { planReceiptPhoto, uploadReceiptPhoto } from "@/presentation/receipt-upload";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { categoryOptions } from "@/presentation/categories";
import { ReceiptPhotoPicker } from "./receipt-photo-picker";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { MoneyInput } from "./money-input";
import { Input, NativeSelect } from "./ui/input";
import { Label } from "./ui/label";

export function ReceiptForm({ companyId, employeeId }: { companyId: string; employeeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ActionResult | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    router.push("/campo");
  }, [router, state]);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setState(null);
    if (!file) {
      setPending(false);
      setState({ ok: false, message: "Escolha uma foto JPG, PNG ou WebP." });
      return;
    }
    const planned = planReceiptPhoto(file, { companyId, employeeId });
    if (!planned.ok) {
      setPending(false);
      setState(planned);
      return;
    }
    const draft = {
      id: crypto.randomUUID(),
      companyId,
      employeeId,
      amountReais: String(formData.get("amountReais") ?? ""),
      category: String(formData.get("category") ?? ""),
      placeNote: String(formData.get("placeNote") ?? ""),
      storagePath: planned.path,
      file,
      createdAt: new Date().toISOString(),
      lastError: null,
    };
    if (!navigator.onLine) {
      const saved = await keepDraft(draft);
      setPending(false);
      setState(saved);
      if (saved.ok === false && saved.message.startsWith("Sem rede")) setFile(null);
      return;
    }
    const uploaded = await uploadReceiptPhoto(file, { companyId, employeeId }, planned.path);
    if (!uploaded.ok) {
      if (!uploaded.offline) {
        setPending(false);
        setState({ ok: false, message: uploaded.message });
        return;
      }
      const saved = await keepDraft(draft);
      setPending(false);
      setState(saved);
      if (saved.message.startsWith("Sem rede")) setFile(null);
      return;
    }
    formData.set("storagePath", uploaded.path);
    const result = await submitReceiptAction(null, formData);
    if (!result.ok && /não foi possível falar com o banco|sem rede|failed to fetch/i.test(result.message)) {
      const saved = await keepDraft(draft);
      setPending(false);
      setState(saved);
      if (saved.message.startsWith("Sem rede")) setFile(null);
      return;
    }
    setPending(false);
    setState(result);
  }

  return (
    <form action={onSubmit}>
      <FieldGroup>
        <Field>
          <p className="text-sm font-medium text-foreground">Foto</p>
          <ReceiptPhotoPicker onFile={setFile} />
        </Field>
        <Field>
          <Label htmlFor="receipt-amount">Valor</Label>
          <MoneyInput id="receipt-amount" name="amountReais" required />
        </Field>
        <Field>
          <Label htmlFor="receipt-category">Categoria</Label>
          <NativeSelect id="receipt-category" name="category" required defaultValue="combustivel">
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <Label htmlFor="receipt-note">Observação</Label>
          <Input id="receipt-note" name="placeNote" maxLength={200} />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar comprovante"}
        </Button>
        {state && !state.ok ? (
          <p className={state.message.startsWith("Sem rede") ? "text-sm text-foreground" : "text-sm text-destructive"} role={state.message.startsWith("Sem rede") ? "status" : "alert"}>
            {state.message}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}

async function keepDraft(draft: QueuedReceipt): Promise<{ ok: false; message: string }> {
  try {
    await saveQueuedReceipt(draft);
    return { ok: false, message: "Sem rede. O comprovante ficou na fila deste aparelho." };
  } catch {
    return { ok: false, message: "Não foi possível guardar o comprovante neste aparelho." };
  }
}
