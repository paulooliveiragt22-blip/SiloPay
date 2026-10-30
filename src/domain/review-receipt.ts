import { decideReview, type Cents } from "./money";
import type { ReviewReceiptPort } from "./ports";
import { err, type Result } from "./result";
import { parseReviewReceipt, parseUuid, type ReviewReceiptResult } from "./rpc";

export async function reviewReceipt(
  port: ReviewReceiptPort,
  input: { receiptId: string; claimed: Cents; approved: unknown },
): Promise<Result<ReviewReceiptResult>> {
  const receiptId = parseUuid(input.receiptId);
  if (!receiptId.ok) return receiptId;

  const decision = decideReview(input.claimed, input.approved);
  if (!decision.ok) return decision;

  const raw = await port.reviewReceipt({
    receiptId: receiptId.value,
    approvedCents: decision.value.approved,
  });
  const parsed = parseReviewReceipt(raw);
  if (!parsed.ok) return parsed;
  if (parsed.value.status !== decision.value.status) return err("retorno_rpc_invalido");
  if (parsed.value.amountApprovedCents !== decision.value.approved) return err("retorno_rpc_invalido");
  return parsed;
}
