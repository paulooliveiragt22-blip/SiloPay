"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/data/supabase/browser";
import { Button } from "./ui/button";

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
    <Button type="button" variant="ghost" size="sm" onClick={signOut} disabled={pending}>
      {pending ? "Saindo…" : "Sair"}
    </Button>
  );
}
