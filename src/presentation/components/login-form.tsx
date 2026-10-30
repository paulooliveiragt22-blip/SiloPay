"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/data/supabase/browser";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      setMessage("E-mail ou senha não conferem.");
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <form action={onSubmit}>
      <FieldGroup>
        <Field>
          <Label htmlFor="login-email">E-mail</Label>
          <Input id="login-email" name="email" type="email" autoComplete="username" required />
        </Field>
        <Field>
          <Label htmlFor="login-password">Senha</Label>
          <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
        {message ? (
          <p className="text-sm text-destructive" role="alert">
            {message}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}
