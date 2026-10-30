"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SignOutButton } from "@/presentation/components/sign-out-button";
import { ThemeToggle } from "@/presentation/components/theme-toggle";
import { Wordmark } from "@/presentation/components/wordmark";
import { cn } from "@/presentation/cn";
import { AdminNav } from "./admin-nav";
import { Button } from "./ui/button";

const storageKey = "silopay-sidebar";

export function AdminShell({ companyName, children }: { companyName: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(storageKey) === "recolhida");
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, next ? "recolhida" : "aberta");
      return next;
    });
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col gap-6 border-r border-white/15 bg-brand px-3 py-4 text-white lg:flex",
          collapsed ? "w-16 px-2" : "w-64",
        )}
      >
        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-between px-1")}>
          {collapsed ? null : (
            <a href="/admin">
              <Wordmark className="text-lg text-white" />
            </a>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            aria-expanded={!collapsed}
            aria-controls="admin-nav"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={toggleSidebar}
          >
            <ChevronIcon collapsed={collapsed} />
          </Button>
        </div>
        <AdminNav tone="brand" collapsed={collapsed} />
        <div className="mt-auto">
          <ThemeToggle tone="brand" labeled={!collapsed} />
        </div>
      </aside>
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <Wordmark className="text-base text-foreground lg:hidden" />
            <p className="truncate text-sm text-muted-foreground lg:text-lg lg:text-foreground">{companyName}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="lg:hidden">
              <ThemeToggle />
            </div>
            <SignOutButton />
          </div>
        </header>
        {children}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 bg-primary pb-[env(safe-area-inset-bottom)] dark:bg-brand lg:hidden">
        <AdminNav tone="bar" />
      </div>
    </div>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path
        d={collapsed ? "M6 3.5 10.5 8 6 12.5" : "M10 3.5 5.5 8 10 12.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
