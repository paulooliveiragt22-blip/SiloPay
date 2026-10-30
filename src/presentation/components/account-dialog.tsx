"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent } from "./ui/dialog";

export function AccountDialog({ open, children }: { open: boolean; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) router.replace(pathname, { scroll: false });
      }}
    >
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
