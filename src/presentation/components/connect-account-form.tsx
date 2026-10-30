"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { conectarContaAction } from "@/presentation/actions/conectar-conta";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Input, NativeSelect } from "./ui/input";
import { Label } from "./ui/label";

export function ConnectAccountForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(conectarContaAction, null as ActionResult | null);
  const [provider, setProvider] = useState("");
  const [externalAccountId, setExternalAccountId] = useState("");
  const [environment, setEnvironment] = useState("sandbox");
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  useEffect(() => {
    if (!state?.ok) return;
    toast.success(state.message);
    setApiKey("");
    setWebhookSecret("");
    router.refresh();
    router.replace("/admin/pagamentos");
  }, [router, state]);

  return (
    <form action={action}>
      <FieldGroup>
        <Field>
          <Label htmlFor="payment-provider">Código do adaptador</Label>
          <Input
            id="payment-provider"
            name="provider"
            required
            autoComplete="off"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="payment-external">Id da conta no gateway</Label>
          <Input
            id="payment-external"
            name="externalAccountId"
            required
            autoComplete="off"
            value={externalAccountId}
            onChange={(event) => setExternalAccountId(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="payment-environment">Ambiente</Label>
          <NativeSelect
            id="payment-environment"
            name="environment"
            value={environment}
            onChange={(event) => setEnvironment(event.target.value)}
          >
            <option value="sandbox">Sandbox</option>
            <option value="producao">Produção</option>
          </NativeSelect>
        </Field>
        <Field>
          <Label htmlFor="payment-api-key">Chave de API</Label>
          <Input
            id="payment-api-key"
            name="apiKey"
            type="password"
            required
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="payment-webhook">Segredo do webhook</Label>
          <Input
            id="payment-webhook"
            name="webhookSecret"
            type="password"
            required
            autoComplete="off"
            value={webhookSecret}
            onChange={(event) => setWebhookSecret(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Conectando…" : "Conectar conta"}
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
