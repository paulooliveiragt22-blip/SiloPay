"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { devolverSobraAction } from "@/presentation/actions/devolver-sobra";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field } from "./ui/field";
import { MoneyInput } from "./money-input";
import { Label } from "./ui/label";

export function ReturnForm({ employeeId }: { employeeId: string }) {
  const [state, action, pending] = useActionState(devolverSobraAction, null as ActionResult | null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="min-w-0 flex-1">
          <Label htmlFor={`return-amount-${employeeId}`}>Devolver sobra</Label>
          <MoneyInput
            id={`return-amount-${employeeId}`}
            name="amountReais"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Button type="submit" variant="outline" disabled={pending || idempotencyKey.length === 0}>
          {pending ? "Devolvendo…" : "Devolver"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Este valor sai da subconta e volta para o saldo da empresa.</p>
      {state ? (
        <p className={state.ok ? "text-sm text-foreground" : "text-sm text-destructive"} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
