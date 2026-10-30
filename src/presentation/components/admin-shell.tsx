import type { ReactNode } from "react";
import { SignOutButton } from "@/presentation/components/sign-out-button";
import { Wordmark } from "@/presentation/components/wordmark";
import { AdminNav } from "./admin-nav";

export function AdminShell({ companyName, children }: { companyName: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 bg-brand px-3 py-4 text-white md:flex">
        <a href="/admin" className="px-3">
          <Wordmark className="text-lg text-white" />
        </a>
        <AdminNav tone="brand" />
      </aside>
      <div className="flex min-h-dvh flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <p className="min-w-0 truncate text-lg text-foreground">{companyName}</p>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </header>
        <div className="border-b border-border bg-card px-2 py-2 md:hidden">
          <AdminNav tone="card" />
        </div>
        {children}
      </div>
    </div>
  );
}
