"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { abrirAcessoAction, renovarSenhaAction, type SenhaProvisoriaResult } from "@/presentation/actions/acesso-colaborador";
import { ProvisionalPassword } from "./provisional-password";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function EmployeeAccessForm({ employeeId, linked }: { employeeId: string; linked: boolean }) {
  const router = useRouter();
  const action = linked ? renovarSenhaAction : abrirAcessoAction;
  const [state, formAction, pending] = useActionState(action, null as SenhaProvisoriaResult | null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [router, state]);

  if (state?.ok) return <ProvisionalPassword password={state.provisionalPassword} />;

  return (
    <form action={formAction}>
      <input type="hidden" name="employeeId" value={employeeId} />
      <FieldGroup>
        {linked ? (
          <p className="text-sm text-muted-foreground">
            Gera outra senha temporária, vale 24 horas, e derruba as sessões abertas deste colaborador.
          </p>
        ) : (
          <Field>
            <Label htmlFor="access-email">E-mail do colaborador</Label>
            <Input
              id="access-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        )}
        {state && !state.ok ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" variant="outline" disabled={pending || (!linked && email.trim().length === 0)}>
          {pending ? "Gerando…" : "Gerar senha temporária"}
        </Button>
      </FieldGroup>
    </form>
  );
}
