"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RECEIPT_PHOTO_MAX_BYTES, parseReceiptPhotoPath } from "@/domain/receipt";
import { RECEIPT_BUCKET } from "@/data/supabase/receipt-bucket";
import { createBrowserSupabase } from "@/data/supabase/browser";
import { submitReceiptAction } from "@/presentation/actions/submit-receipt";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { categoryOptions } from "@/presentation/categories";

const inputClass = "h-9 rounded-md border border-input bg-card px-3";

export function ReceiptForm({ companyId, employeeId }: { companyId: string; employeeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ActionResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    router.push("/campo");
  }, [router, state]);

  function onFile(file: File | null) {
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setState(null);
    const file = formData.get("photo");
    const extension = file instanceof File ? extensionOf(file) : null;
    if (!(file instanceof File) || file.size === 0 || !extension) {
      setPending(false);
      setState({ ok: false, message: "Escolha uma foto JPG, PNG ou WebP." });
      return;
    }
    if (file.size > RECEIPT_PHOTO_MAX_BYTES) {
      setPending(false);
      setState({ ok: false, message: "A foto passa de 5 MB." });
      return;
    }

    const path = parseReceiptPhotoPath(
      `${companyId}/${employeeId}/${crypto.randomUUID()}.${extension}`,
      { companyId, employeeId },
    );
    if (!path.ok) {
      setPending(false);
      setState({ ok: false, message: "Não foi possível montar o caminho da foto." });
      return;
    }

    const supabase = createBrowserSupabase();
    const uploaded = await supabase.storage.from(RECEIPT_BUCKET).upload(path.value, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploaded.error) {
      setPending(false);
      setState({ ok: false, message: "Não foi possível enviar a foto." });
      return;
    }

    formData.set("storagePath", path.value);
    const result = await submitReceiptAction(null, formData);
    setPending(false);
    setState(result);
  }

  return (
    <form action={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Foto
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-sm"
          onChange={(event) => onFile(event.currentTarget.files?.[0] ?? null)}
        />
      </label>
      {preview ? (
        <img src={preview} alt="Prévia do comprovante" className="aspect-[4/3] w-full rounded-md bg-muted object-contain" />
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        Valor (R$)
        <input name="amountReais" inputMode="decimal" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Categoria
        <select name="category" required className={inputClass} defaultValue="combustivel">
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Observação
        <input name="placeNote" maxLength={200} className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar comprovante"}
      </button>
      {state && !state.ok ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function extensionOf(file: File): "jpg" | "png" | "webp" | null {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return null;
}
