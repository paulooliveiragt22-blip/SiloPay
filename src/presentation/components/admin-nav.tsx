"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/presentation/cn";

const items = [
  { href: "/admin", label: "Início" },
  { href: "/admin/comprovantes", label: "Comprovantes" },
  { href: "/admin/colaboradores", label: "Colaboradores" },
  { href: "/admin/pagamentos", label: "Conta" },
  { href: "/admin/extrato", label: "Extrato da empresa" },
] as const;

export function AdminNav({ tone }: { tone: "brand" | "card" }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Painel" className={tone === "brand" ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto"}>
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm whitespace-nowrap",
              tone === "brand" && active && "bg-white/15 font-medium text-white",
              tone === "brand" && !active && "text-white/80 hover:bg-white/10",
              tone === "card" && active && "bg-muted font-medium text-foreground",
              tone === "card" && !active && "text-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
