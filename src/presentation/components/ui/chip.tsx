"use client";

import Link from "next/link";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/presentation/cn";
import { Button, type ButtonProps } from "./button";

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
      <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const Chip = forwardRef<HTMLButtonElement, ButtonProps>(function Chip(
  { className, children, type = "button", ...props },
  ref,
) {
  return (
    <Button ref={ref} type={type} variant="outline" size="sm" className={cn("rounded-full", className)} {...props}>
      <PlusIcon />
      {children}
    </Button>
  );
});

export function ChipLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline" size="sm" className="rounded-full">
      <Link href={href}>
        <PlusIcon />
        {children}
      </Link>
    </Button>
  );
}
