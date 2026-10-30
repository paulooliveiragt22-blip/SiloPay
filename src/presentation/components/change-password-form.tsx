"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trocarSenhaInicialAction, type TrocaSenhaResult } from "@/presentation/actions/trocar-senha";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function ChangePasswordForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(trocarSenhaInicialAction, null as TrocaSenhaResult | null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    router.replace("/");
  }, [router, state]);

  return (
    <form action={action}>
      <FieldGroup>
        <Field>
          <Label htmlFor="current-password">Senha temporária</Label>
          <Input
            id="current-password"
            name="current"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="next-password">Senha nova</Label>
          <Input
            id="next-password"
            name="next"
            type="password"
            autoComplete="new-password"
            required
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="confirm-password">Confirmar senha nova</Label>
          <Input
            id="confirm-password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
        {state && !state.ok ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Trocar senha"}
        </Button>
      </FieldGroup>
    </form>
  );
}
