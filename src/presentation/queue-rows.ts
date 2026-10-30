import type { FilaItem } from "@/data/supabase/reads";
import { categoryLabel } from "@/presentation/categories";
import { formatCents } from "@/presentation/format";

export type QueueRow = {
  receiptId: string;
  employeeName: string;
  categoryLabel: string;
  placeNote: string | null;
  amountLabel: string;
  claimedCents: number;
  photoUrl: string | null;
};

export function toQueueRows(fila: FilaItem[]): QueueRow[] {
  return fila.map((item) => ({
    receiptId: item.receiptId,
    employeeName: item.employeeName,
    categoryLabel: categoryLabel(item.category),
    placeNote: item.placeNote,
    amountLabel: formatCents(item.amountClaimedCents),
    claimedCents: item.amountClaimedCents,
    photoUrl: item.photoUrl,
  }));
}
