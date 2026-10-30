"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { adiantamentoTesteAction } from "@/presentation/actions/adiantamento-teste";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field } from "./ui/field";
import { MoneyInput } from "./money-input";
import { Label } from "./ui/label";

export function TestAdvanceForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(adiantamentoTesteAction, null as ActionResult | null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [router, state]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="min-w-0 flex-1">
          <Label htmlFor={`adiantamento-${employeeId}`}>Adiantamento de teste</Label>
          <MoneyInput id={`adiantamento-${employeeId}`} name="amountReais" required />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Lançando…" : "Lançar teste"}
        </Button>
      </div>
      {state ? (
        <p className={state.ok ? "text-sm text-foreground" : "text-sm text-destructive"} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
