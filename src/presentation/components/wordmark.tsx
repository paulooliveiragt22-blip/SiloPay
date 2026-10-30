import { cn } from "@/presentation/cn";

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-wordmark font-bold text-foreground", className)}>SiloPay</span>;
}
