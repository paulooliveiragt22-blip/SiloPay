"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { transferirAction } from "@/presentation/actions/transferir";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field } from "./ui/field";
import { MoneyInput } from "./money-input";
import { NativeSelect } from "./ui/input";
import { Label } from "./ui/label";

export function TransferForm({ employeeId }: { employeeId: string }) {
  const [state, action, pending] = useActionState(transferirAction, null as ActionResult | null);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState("adiantamento");

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="min-w-0 flex-1">
          <Label htmlFor={`pix-kind-${employeeId}`}>Tipo</Label>
          <NativeSelect id={`pix-kind-${employeeId}`} name="kind" value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="adiantamento">Adiantamento</option>
            <option value="reembolso">Reembolso</option>
          </NativeSelect>
        </Field>
        <Field className="min-w-0 flex-1">
          <Label htmlFor={`pix-amount-${employeeId}`}>Valor</Label>
          <MoneyInput
            id={`pix-amount-${employeeId}`}
            name="amountReais"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={pending || idempotencyKey.length === 0}>
          {pending ? "Enviando…" : "Enviar saldo"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Este valor sai do saldo da empresa e entra na subconta.</p>
      {state ? (
        <p className={state.ok ? "text-sm text-foreground" : "text-sm text-destructive"} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
