"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitReceiptAction } from "@/presentation/actions/submit-receipt";
import { uploadReceiptPhoto } from "@/presentation/receipt-upload";
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
    const uploaded = await uploadReceiptPhoto(file, { companyId, employeeId });
    if (!uploaded.ok) {
      setPending(false);
      setState(uploaded);
      return;
    }
    formData.set("storagePath", uploaded.path);
    const result = await submitReceiptAction(null, formData);
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
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}
