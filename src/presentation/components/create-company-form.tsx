"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { criarEmpresaAction } from "@/presentation/actions/criar-empresa";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CreateCompanyForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(criarEmpresaAction, null as ActionResult | null);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      router.push("/");
    }
  }, [router, state]);

  return (
    <form action={action}>
      <FieldGroup>
        <Field>
          <Label htmlFor="company-name">Nome</Label>
          <Input id="company-name" name="name" required />
        </Field>
        <Field>
          <Label htmlFor="company-cnpj">CNPJ</Label>
          <Input id="company-cnpj" name="cnpj" required inputMode="numeric" />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar empresa"}
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
