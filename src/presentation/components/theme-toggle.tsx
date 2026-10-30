"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/presentation/cn";
import { Button } from "./ui/button";

export function ThemeToggle({ tone = "card", labeled = false }: { tone?: "card" | "brand"; labeled?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Usar modo claro" : "Usar modo escuro";

  return (
    <Button
      type="button"
      variant="ghost"
      size={labeled ? "sm" : "icon"}
      className={cn(tone === "brand" && "text-white hover:bg-white/10 hover:text-white", labeled && "w-full justify-start")}
      aria-pressed={mounted ? dark : undefined}
      aria-label={labeled ? undefined : label}
      disabled={!mounted}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
      {labeled ? <span>{dark ? "Modo claro" : "Modo escuro"}</span> : null}
    </Button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path
        d="M9.5 2.2A5.8 5.8 0 1 0 13.8 10 4.6 4.6 0 0 1 9.5 2.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <circle cx="8" cy="8" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
