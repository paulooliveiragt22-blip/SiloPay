"use client";

import { forwardRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { maskBrlInput } from "@/presentation/format";
import { cn } from "@/presentation/cn";
import { Input } from "./ui/input";

export const MoneyInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function MoneyInput(
  { className, onChange, value, defaultValue, ...props },
  ref,
) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => maskBrlInput(typeof defaultValue === "string" ? defaultValue : ""));
  const shown = controlled ? maskBrlInput(String(value ?? "")) : inner;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = maskBrlInput(event.target.value);
    if (!controlled) setInner(next);
    event.target.value = next;
    const end = next.length;
    event.target.setSelectionRange(end, end);
    onChange?.(event);
  }

  return (
    <div className="relative w-full">
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        ref={ref}
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0,00"
        className={cn("pl-9", className)}
        value={shown}
        onChange={handleChange}
      />
    </div>
  );
});
