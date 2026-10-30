"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/presentation/cn";

const items = [
  { href: "/admin", label: "Início", icon: HomeIcon },
  { href: "/admin/comprovantes", label: "Comprovantes", icon: ReceiptIcon },
  { href: "/admin/colaboradores", label: "Colaboradores", icon: PeopleIcon },
  { href: "/admin/pagamentos", label: "Conta", icon: WalletIcon },
  { href: "/admin/extrato", label: "Extrato da empresa", short: "Extrato", icon: ListIcon },
] as const;

export function AdminNav({ tone, collapsed = false }: { tone: "brand" | "bar"; collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav id={tone === "brand" ? "admin-nav" : undefined} aria-label="Painel" className={tone === "brand" ? "flex flex-col gap-1" : "grid grid-cols-5 gap-1 px-1 py-1"}>
      {items.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        const label = tone === "bar" && "short" in item ? item.short : item.label;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={tone === "brand" && collapsed ? item.label : undefined}
            className={cn(
              tone === "brand" && "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              tone === "brand" && collapsed && "justify-center px-2",
              tone === "brand" && active && "bg-white/15 font-medium text-white",
              tone === "brand" && !active && "text-white/80 hover:bg-white/10",
              tone === "bar" && "flex min-h-14 flex-col items-center justify-center gap-1 bg-transparent px-1 py-2 text-center text-xs leading-tight text-secondary",
              tone === "bar" && active && "font-medium",
            )}
          >
            <Icon />
            <span className={tone === "brand" && collapsed ? "sr-only" : undefined}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path d="M2.5 7.5 8 2.5l5.5 5V13a1 1 0 0 1-1 1h-3.2V9.5H6.7V14H3.5a1 1 0 0 1-1-1V7.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path d="M4 2.5h8v11l-1.4-1-1.3 1-1.3-1-1.3 1-1.3-1L4 13.5v-11Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 6h4M6 8.5h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <circle cx="6" cy="5.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 12.5c.4-2 1.8-3 3.5-3s3.1 1 3.5 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="6" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.2 9.6c1.3.2 2.3.9 2.8 2.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <rect x="2" y="4" width="12" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 7h12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="10" r="0.8" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
      <path d="M3 4.5h10M3 8h10M3 11.5h7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
