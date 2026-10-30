"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { transferirAction } from "@/presentation/actions/transferir";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { centsToReaisInput, formatCents } from "@/presentation/format";
import { Button } from "./ui/button";

export function BalanceNotice({
  employeeId,
  saldoCents,
  companySaldoCents,
}: {
  employeeId: string;
  saldoCents: number;
  companySaldoCents: number;
}) {
  if (saldoCents > 0) {
    return (
      <p className="text-sm text-foreground" role="status">
        Sobra de {formatCents(saldoCents)} para devolver à empresa.
      </p>
    );
  }
  if (saldoCents < 0) {
    return (
      <ReimburseDue
        employeeId={employeeId}
        dueCents={-saldoCents}
        companySaldoCents={companySaldoCents}
        saldoCents={saldoCents}
      />
    );
  }
  return null;
}

function ReimburseDue({
  employeeId,
  dueCents,
  companySaldoCents,
  saldoCents,
}: {
  employeeId: string;
  dueCents: number;
  companySaldoCents: number;
  saldoCents: number;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(transferirAction, null as ActionResult | null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const covered = companySaldoCents >= dueCents;

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [router, state]);

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="employeeId" value={employeeId} />
      <input type="hidden" name="kind" value="reembolso" />
      <input type="hidden" name="amountReais" value={centsToReaisInput(dueCents)} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <p className="text-sm text-foreground" role="status">
        Saldo da subconta {formatCents(saldoCents)}. A empresa reembolsa {formatCents(dueCents)}.
      </p>
      {covered ? null : (
        <p className="text-sm text-destructive" role="status">
          O saldo da empresa não cobre este reembolso.
        </p>
      )}
      <Button type="submit" size="sm" className="w-fit" disabled={pending || !covered || idempotencyKey.length === 0}>
        {pending ? "Reembolsando…" : `Reembolsar ${formatCents(dueCents)}`}
      </Button>
      {state ? (
        <p className={state.ok ? "text-sm text-foreground" : "text-sm text-destructive"} role={state.ok ? "status" : "alert"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
