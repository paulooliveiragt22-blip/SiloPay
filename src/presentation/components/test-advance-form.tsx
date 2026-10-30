"use client";

import { useActionState } from "react";
import { adiantamentoTesteAction } from "@/presentation/actions/adiantamento-teste";
import type { ActionResult } from "@/presentation/actions/review-receipt";

export function TestAdvanceForm({ employeeId }: { employeeId: string }) {
  const [state, action, pending] = useActionState(adiantamentoTesteAction, null as ActionResult | null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <label className="flex flex-col gap-1 text-sm">
        Adiantamento de teste (R$)
        <input
          name="amountReais"
          inputMode="decimal"
          required
          className="h-9 w-36 rounded-md border border-input bg-card px-3"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-accent px-3 text-sm text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Lançando…" : "Lançar teste"}
      </button>
      {state ? (
        <p className={state.ok ? "text-sm" : "text-sm text-destructive"}>{state.message}</p>
      ) : null}
    </form>
  );
}
