import type { ReactNode } from "react";
import { AdminShell } from "@/presentation/components/admin-shell";
import { SignOutButton } from "@/presentation/components/sign-out-button";
import { Wordmark } from "@/presentation/components/wordmark";
import { verifySession } from "@/presentation/session";
import { readMinhaEmpresa } from "@/data/supabase/reads";

export default async function SessionLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  const role = session.membership?.role;

  if (role === "admin") {
    const companyName = (await readMinhaEmpresa()) ?? "Empresa";
    return <AdminShell companyName={companyName}>{children}</AdminShell>;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
        <a href="/" className="text-lg text-foreground">
          <Wordmark />
        </a>
        {role === "funcionario" ? (
          <a href="/campo" className="text-sm font-medium text-foreground">
            Subconta
          </a>
        ) : null}
        <div className="ml-auto">
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
