"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { reviewReceiptAction, type ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field } from "./ui/field";
import { MoneyInput } from "./money-input";
import { Label } from "./ui/label";

export function ReviewForm({ receiptId, claimedCents }: { receiptId: string; claimedCents: number }) {
  const [state, action, pending] = useActionState(reviewReceiptAction, null as ActionResult | null);

  useEffect(() => {
    if (state?.ok) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="receiptId" value={receiptId} />
      <input type="hidden" name="claimedCents" value={claimedCents} />
      <Field>
        <Label htmlFor={`approved-${receiptId}`}>Valor aceito</Label>
        <MoneyInput id={`approved-${receiptId}`} name="approvedReais" />
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="intent" value="baixa" disabled={pending} className="flex-1">
          {pending ? "Baixando…" : "Dar baixa"}
        </Button>
        <Button type="submit" name="intent" value="recusar" variant="destructive" disabled={pending} className="flex-1">
          Recusar
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
