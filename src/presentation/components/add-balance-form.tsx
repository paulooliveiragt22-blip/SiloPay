"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adicionarSaldoAction } from "@/presentation/actions/adicionar-saldo";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { MoneyInput } from "./money-input";
import { Label } from "./ui/label";

export function AddBalanceForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(adicionarSaldoAction, null as ActionResult | null);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!state?.ok) return;
    toast.success(state.message);
    router.refresh();
    router.replace("/admin/pagamentos");
  }, [router, state]);

  return (
    <form action={action}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <FieldGroup>
        <Field>
          <Label htmlFor="company-balance">Valor</Label>
          <MoneyInput
            id="company-balance"
            name="amountReais"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={pending || idempotencyKey.length === 0}>
          {pending ? "Adicionando…" : "Adicionar saldo"}
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
