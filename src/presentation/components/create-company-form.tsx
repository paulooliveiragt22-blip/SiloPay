"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { criarEmpresaAction } from "@/presentation/actions/criar-empresa";
import type { ActionResult } from "@/presentation/actions/review-receipt";

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
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input name="name" required className="h-9 rounded-md border border-input bg-card px-3" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        CNPJ
        <input name="cnpj" required inputMode="numeric" className="h-9 rounded-md border border-input bg-card px-3" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Criando…" : "Criar empresa"}
      </button>
      {state && !state.ok ? <p className="text-sm text-destructive">{state.message}</p> : null}
    </form>
  );
}
