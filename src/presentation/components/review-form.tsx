"use client";

import { useActionState } from "react";
import { reviewReceiptAction, type ActionResult } from "@/presentation/actions/review-receipt";

export function ReviewForm({ receiptId, claimedCents }: { receiptId: string; claimedCents: number }) {
  const [state, action, pending] = useActionState(reviewReceiptAction, null as ActionResult | null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="receiptId" value={receiptId} />
      <input type="hidden" name="claimedCents" value={claimedCents} />
      <label className="flex flex-col gap-1 text-sm">
        Valor aceito (R$)
        <input
          name="approvedReais"
          inputMode="decimal"
          required
          className="h-9 rounded-md border border-input bg-card px-3"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Baixando…" : "Dar baixa"}
      </button>
      {state ? (
        <p className={state.ok ? "text-sm" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}
