import type { ReactNode } from "react";
import { SignOutButton } from "@/presentation/components/sign-out-button";
import { Wordmark } from "@/presentation/components/wordmark";
import { verifySession } from "@/presentation/session";

export default async function SessionLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  const role = session.membership?.role;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
        <a href="/" className="text-lg text-foreground">
          <Wordmark />
        </a>
        {role === "admin" ? (
          <a href="/admin" className="text-sm text-accent">
            Funcionários
          </a>
        ) : null}
        {role === "admin" ? (
          <a href="/admin/comprovantes" className="text-sm text-accent">
            Fila
          </a>
        ) : null}
        {role === "funcionario" ? (
          <a href="/campo" className="text-sm text-accent">
            Subconta
          </a>
        ) : null}
        {role === "funcionario" ? (
          <a href="/campo/comprovantes/novo" className="text-sm text-accent">
            Comprovante
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
