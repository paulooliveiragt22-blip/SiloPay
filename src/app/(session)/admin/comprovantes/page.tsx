import { readFila } from "@/data/supabase/reads";
import { signReceiptPhoto } from "@/data/supabase/storage";
import { categoryLabel } from "@/presentation/categories";
import { ExpenseStatus, expenseRowClass } from "@/presentation/components/expense-status";
import { ReceiptPhoto } from "@/presentation/components/receipt-photo";
import { formatCents } from "@/presentation/format";
import { ReviewForm } from "@/presentation/components/review-form";
import { PageStack } from "@/presentation/components/saldo";

export const dynamic = "force-dynamic";

export default async function FilaPage() {
  const fila = await readFila();
  const photos = new Map(
    await Promise.all(fila.map(async (item) => [item.receiptId, await signReceiptPhoto(item.storagePath)] as const)),
  );

  return (
    <PageStack title="Comprovantes em análise">
      {fila.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comprovante na fila.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {fila.map((item) => (
            <li
              key={item.receiptId}
              className={expenseRowClass("pending", "grid gap-4 p-4 lg:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)]")}
            >
              <ReceiptPhoto src={photos.get(item.receiptId) ?? null} alt={`Comprovante de ${item.employeeName}`} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1 text-sm">
                  <ExpenseStatus tone="pending">Pendente de aprovação</ExpenseStatus>
                  <p className="truncate font-medium">{item.employeeName}</p>
                  <p>{categoryLabel(item.category)}</p>
                  <p>Informado: {formatCents(item.amountClaimedCents)}</p>
                  {item.placeNote ? <p className="text-muted-foreground">{item.placeNote}</p> : null}
                </div>
                <ReviewForm receiptId={item.receiptId} claimedCents={item.amountClaimedCents} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageStack>
  );
}
