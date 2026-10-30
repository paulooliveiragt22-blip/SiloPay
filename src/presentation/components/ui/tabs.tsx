"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/presentation/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<HTMLDivElement, ComponentProps<typeof TabsPrimitive.List>>(function TabsList(
  { className, ...props },
  ref,
) {
  return <TabsPrimitive.List ref={ref} className={cn("flex w-full border-b border-border", className)} {...props} />;
});

export const TabsTrigger = forwardRef<HTMLButtonElement, ComponentProps<typeof TabsPrimitive.Trigger>>(
  function TabsTrigger({ className, ...props }, ref) {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "min-h-11 min-w-0 flex-1 truncate border-b-2 border-transparent px-2 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:font-medium data-[state=active]:text-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);

export const TabsContent = forwardRef<HTMLDivElement, ComponentProps<typeof TabsPrimitive.Content>>(
  function TabsContent({ className, ...props }, ref) {
    return (
      <TabsPrimitive.Content
        ref={ref}
        className={cn("flex flex-col gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
        {...props}
      />
    );
  },
);
