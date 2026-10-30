import type { ReactNode } from "react";
import { AdminShell } from "@/presentation/components/admin-shell";
import { SignOutButton } from "@/presentation/components/sign-out-button";
import { ThemeToggle } from "@/presentation/components/theme-toggle";
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
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <a href="/" className="text-lg text-foreground">
          <Wordmark />
        </a>
        {role === "funcionario" ? (
          <a href="/campo" className="text-sm font-medium text-foreground">
            Subconta
          </a>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
