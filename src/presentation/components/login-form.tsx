"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/data/supabase/browser";

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
    <form action={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="h-9 rounded-md border border-input bg-card px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-9 rounded-md border border-input bg-card px-3"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </form>
  );
}
