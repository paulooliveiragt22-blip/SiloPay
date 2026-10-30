"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReceiptForm } from "./receipt-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

export function ReceiptCreateDialog({
  open,
  companyId,
  employeeId,
}: {
  open: boolean;
  companyId: string;
  employeeId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) router.replace(pathname, { scroll: false });
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo comprovante</DialogTitle>
          <DialogDescription>Foto, valor e categoria. A baixa é feita pela empresa.</DialogDescription>
        </DialogHeader>
        <ReceiptForm companyId={companyId} employeeId={employeeId} />
      </DialogContent>
    </Dialog>
  );
}
