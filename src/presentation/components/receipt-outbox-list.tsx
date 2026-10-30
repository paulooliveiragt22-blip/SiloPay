"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitReceiptAction } from "@/presentation/actions/submit-receipt";
import { categoryLabel } from "@/presentation/categories";
import { listQueuedReceipts, removeQueuedReceipt, saveQueuedReceipt, type QueuedReceipt } from "@/presentation/receipt-outbox";
import { uploadReceiptPhoto } from "@/presentation/receipt-upload";
import { Button } from "./ui/button";

export function ReceiptOutbox({ companyId, employeeId }: { companyId: string; employeeId: string }) {
  const [items, setItems] = useState<QueuedReceipt[]>([]);
  const sending = useRef(false);

  const reload = useCallback(async () => {
    try {
      setItems(await listQueuedReceipts(employeeId));
    } catch {
      setItems([]);
    }
  }, [employeeId]);

  const flush = useCallback(async () => {
    if (sending.current || !navigator.onLine) {
      await reload();
      return;
    }
    sending.current = true;
    try {
      const queued = await listQueuedReceipts(employeeId);
      for (const item of queued) {
        if (item.companyId !== companyId || item.lastError) continue;
        const result = await sendQueued(item);
        if (result === "sent") await removeQueuedReceipt(item.id);
        else if (result === "queued") break;
        else await saveQueuedReceipt({ ...item, lastError: result });
      }
    } finally {
      sending.current = false;
      await reload();
    }
  }, [companyId, employeeId, reload]);

  useEffect(() => {
    const onOutbox = () => void reload();
    const onOnline = () => void flush();
    window.addEventListener("silopay-outbox", onOutbox);
    window.addEventListener("online", onOnline);
    void flush();
    return () => {
      window.removeEventListener("silopay-outbox", onOutbox);
      window.removeEventListener("online", onOnline);
    };
  }, [flush, reload]);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Fila neste aparelho</h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <p className="text-sm text-foreground">
              {item.amountReais} · {categoryLabel(item.category)}
            </p>
            <p className="text-sm text-muted-foreground">{item.lastError ?? "Aguardando rede para enviar."}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void retry(item, flush)}>
                Tentar agora
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void removeQueuedReceipt(item.id)}>
                Remover
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function retry(item: QueuedReceipt, flush: () => Promise<void>) {
  await saveQueuedReceipt({ ...item, lastError: null });
  await flush();
}

async function sendQueued(item: QueuedReceipt): Promise<"sent" | "queued" | string> {
  const extension = item.storagePath.split(".").pop() ?? "jpg";
  const file = new File([item.file], `comprovante.${extension}`, { type: item.file.type || "image/jpeg" });
  const uploaded = await uploadReceiptPhoto(file, { companyId: item.companyId, employeeId: item.employeeId }, item.storagePath);
  if (!uploaded.ok) return uploaded.offline || !navigator.onLine ? "queued" : uploaded.message;

  const form = new FormData();
  form.set("amountReais", item.amountReais);
  form.set("category", item.category);
  form.set("placeNote", item.placeNote);
  form.set("storagePath", uploaded.path);
  const result = await submitReceiptAction(null, form);
  if (result.ok) return "sent";
  if (!navigator.onLine || /não foi possível falar com o banco|sem rede|failed to fetch/i.test(result.message)) return "queued";
  return result.message;
}
