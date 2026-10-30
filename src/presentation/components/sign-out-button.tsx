"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/data/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <button type="button" onClick={signOut} disabled={pending} className="text-sm text-muted-foreground">
      {pending ? "Saindo…" : "Sair"}
    </button>
  );
}
